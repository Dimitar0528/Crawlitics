from sqlalchemy.orm import Session
from rapidfuzz import process, fuzz
from sqlalchemy.orm.attributes import flag_modified

from db.crud import (
    get_parent_product_by_name, 
    create_parent_product, 
    create_product_variant,
)
import re

def get_grouping_key(item: dict[str,any], existing_keys: list, score_cutoff=90) -> str:
    """
    Creates a key to group similar products.
    """
    brand = item.get('brand', 'unknown').strip()

    generic_name = item.get('name', '').split(',')[0].strip()
    
    candidate_name = f"{brand} {generic_name}"

    if not existing_keys:
        print(f"  -> No existing groups. Creating new group for '{generic_name}'")
        return f"{brand}::{generic_name}"

    # compare the generic candidate against the existing generic keys.
    best_match = process.extractOne(
        candidate_name,
        existing_keys,
        scorer=fuzz.WRatio,
        score_cutoff=score_cutoff
    )

    if best_match:
        print(f"  -> Fuzzy Match: '{generic_name}' matched group '{best_match[0]}' with score {best_match[1]:.0f}")
        return best_match[0]
    else:
        print(f"  -> No Fuzzy Match: Creating new group for '{generic_name}'")
        return f"{brand}::{generic_name}"


def normalize_value(value: str) -> str:
    """Helper function to clean string data before comparison."""
    if isinstance(value, str):
        return value.strip().replace("''", '"').replace('\\"', '').replace('inch', '').rstrip(',')

def find_semantically_equal_values(values: list[str], fuzzy_score_cutoff=85) -> bool:
    """
    Determines if a list of values should be considered a common spec using
    a set of abstract, prioritized heuristics.
    """
    if not values:
        return True
    
    if len(set(values)) == 1:
        return True

    # heuristic 1: numeric set equivalence (e.g., "3120x1440" vs "1440 x 3120")
    numeric_sets = {
        frozenset(re.findall(r'\d+\.?\d*', s)) 
        for s in values
    }
    
    # if all values reduce to the exact same set of numbers and the set is not empty, they are equivalent.
    if len(numeric_sets) == 1 and next(iter(numeric_sets)):
        return True


    # heuristic 2: primary number difference (e.g., "12GB" vs "16GB")
    first_numbers = [
        (match.group(0) if (match := re.search(r'\d+\.?\d*', string)) else None)
        for string in values
    ]
    
   # if all values have numbers but they aren't the same, it's a variant.
    if all(first_numbers) and len(set(first_numbers)) > 1:
        return False


    # heuristic 3: fuzzy string matching
    base_string = values[0]
    for other_string in values[1:]:
        score = fuzz.WRatio(base_string, other_string)
        if score < fuzzy_score_cutoff:
            return False
            
    return True
    
def analyze_and_store_group(session: Session, group_key: str, group_items: list[dict[str, any]]):
    """
    Analyzes a group of items and all existing variants to robustly differentiate
    common and variant specs, then updates the parent product and ALL of its
    associated variants in the database.
    """
    print(f"\n--- Processing Group: {group_key} ({len(group_items)} item(s)) ---")

    if not group_items:
        return

    parent_product_name = group_key.split('::')[1]
    parent_product = get_parent_product_by_name(session, parent_product_name)

    all_known_specs: list[dict[str,str]] = [item.get('specs') for item in group_items]
    
    # holds the original full spec sheet for each existing variant.
    existing_variants_full_specs: dict[int, dict] = {}

    if parent_product:
        print(f"Found existing parent product. Consolidating specs from its {len(parent_product.variants)} variants.")
        old_common_specs = (parent_product.common_specs).copy()
        
        for variant in parent_product.variants:
            full_spec = old_common_specs.copy()
            # combine old product common specs with the variant specs from the variant
            full_spec.update(variant.variant_specs)
            all_known_specs.append(full_spec)
            existing_variants_full_specs[variant.id] = full_spec

    # differentiate common vs. variant keys
    all_spec_keys = {key for specs_dict in all_known_specs for key in specs_dict.keys()}
    potential_variant_keys: set[str] = set()
    
    for key in all_spec_keys:
        values = [
            normalized for spec in all_known_specs
            if (normalized := normalize_value(spec.get(key))) is not None
        ]
        if not find_semantically_equal_values(values):
            potential_variant_keys.add(key)

    keys_to_ignore_for_variants = {'features'}
    new_variant_keys: set[str] = potential_variant_keys - keys_to_ignore_for_variants
    new_common_keys: set[str] = all_spec_keys - new_variant_keys

    print(f"Determined New Common Keys: {new_common_keys}")
    print(f"Determined New Variant Keys: {new_variant_keys}")

    if not parent_product:
        print("Creating new parent product...")
        first_item = group_items[0]
        common_specs_dict: dict[str,str] = {}
        for key in new_common_keys:
            common_specs_dict[key] = normalize_value(all_known_specs[0].get(key))

        product_data = {
            "name": parent_product_name, 
            "brand": first_item.get('brand'), 
            "category": first_item.get('category'),
            "description": first_item.get('description'), 
            "common_specs": common_specs_dict,
        }
        parent_product = create_parent_product(session, data=product_data)
    else:
        # update existing parent product by completely replacing its common_specs
        print("Updating existing parent product's common specs...")
        updated_common_specs: dict[str,str] = {}
        for key in new_common_keys:  
            # gets the first non-None, normalized value for a given key or None.
            representative_value = next((normalize_value(specs.get(key)) for specs in all_known_specs if specs.get(key) is not None), None)
            if representative_value is not None:
                updated_common_specs[key] = representative_value

        parent_product.common_specs = updated_common_specs
        flag_modified(parent_product, "common_specs")

    # update all existing variants based on new key structure
    if parent_product and existing_variants_full_specs:
        print(f"Re-calculating variant_specs for all {len(parent_product.variants)} existing variants...")
        for variant in parent_product.variants:
            # get original common and variant specs for variant
            original_full_specs: dict[str,str] = existing_variants_full_specs.get(variant.id)
            # re-build the new variant_specs from scratch using the new variant keys
            new_specs_for_variant = {
                key: normalize_value(original_full_specs.get(key))
                for key in new_variant_keys if original_full_specs.get(key) is not None
            }
            variant.variant_specs = new_specs_for_variant
            flag_modified(variant, "variant_specs")

    existing_variants_by_url = {variant.source_url: variant for variant in parent_product.variants}

    for item in group_items:
        source_url: str = item.get('source_url')
        item_specs: dict[str,str] = item.get('specs')
        existing_variant = existing_variants_by_url.get(source_url)

        if not existing_variant:
            print(f"Creating new variant from URL: {source_url}")
            variant_specs_dict = {key: normalize_value(item_specs.get(key)) for key in new_variant_keys}
            variant_data = {
                "source_url": source_url, 
                "availability": item.get('availability'), 
                "image_url": item.get('image_url'),
                "price": item.get('price'), 
                "currency": item.get('currency'), 
                "variant_specs": variant_specs_dict,
            }
            create_product_variant(session, product_id=parent_product.id, data=variant_data)