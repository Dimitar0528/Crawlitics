from sqlalchemy.orm import Session
from rapidfuzz import process, fuzz

from db.crud import (
    get_parent_product_by_name, 
    create_parent_product, 
    create_product_variant,
    get_product_variant_by_url
)

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
        return value.strip().replace("''", '"').rstrip(',')

def analyze_and_store_group(session: Session, group_key: str, group_items: list[dict[str,any]]):
    """
    Analyzes a group of items, and calls CRUD functions to store them as a
    parent product with multiple variants.
    """
    print(f"\n--- Processing Group: {group_key} ({len(group_items)} item(s)) ---")
    keys_to_ignore = {'features'}
    # one item - parent product, with one variant and all specs are common
    if len(group_items) < 2:
        all_keys = set(group_items[0]['specs'].keys()) if group_items else set()
        return all_keys, set()

    parsed_specs: list[dict[str,str]] = [item['specs'] for item in group_items]

    all_spec_keys: set[str] = set()
    for specs_dict in parsed_specs:
        all_spec_keys.update(specs_dict.keys())
    all_spec_keys -= keys_to_ignore

    common_keys: set[str] = set()
    variant_keys: set[str] = set()

    for key in all_spec_keys:
        # for the current key, collect all its values from every item in the group.
        values = {normalize_value(spec.get(key)) for spec in parsed_specs}

        # if the set of values has more than one member, it means the value for this key differs across products, making it a variant key.
        if len(values) > 1:
            variant_keys.add(key)
        else:
            common_keys.add(key)
            
    print(f"Discovered Common Keys: {common_keys}")
    print(f"Discovered Variant Keys: {variant_keys}")

    first_item = group_items[0]
    parent_product_name = group_key.split('::')[1]
    parent_product = get_parent_product_by_name(session, parent_product_name)
    if not parent_product:
        first_item = group_items[0]
        common_specs_dict = {key: normalize_value(parsed_specs[0].get(key)) for key in common_keys}
        
        product_data = {
            "name": parent_product_name,
            "brand": first_item.get('brand'),
            "category": first_item.get('category'),
            "description": first_item.get('product_description'),
            "common_specs": common_specs_dict
        }
        parent_product = create_parent_product(session, data=product_data)
    else:
        print(f"Found existing parent product: '{parent_product_name}'")

    # create a Variant for each item in the group
    for item, specs in zip(group_items, parsed_specs):
        if get_product_variant_by_url(session, url=item['source_url']):
            print(f"Variant with URL {item['source_url']} already exists. Skipping.")
            continue

        variant_specs_dict = {key: specs.get(key) for key in variant_keys}
        variant_data = {
            "source_url": item['source_url'],
            "availability": item.get('availability'),
            "image_url": item.get('image_url'),
            "price": item.get('price'),
            "currency": item.get('currency'),
            "variant_specs": variant_specs_dict,
        }
        create_product_variant(session, product_id=parent_product.id, data=variant_data)