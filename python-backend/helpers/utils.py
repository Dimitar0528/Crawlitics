import re
from db.models import Product as ProductModel

def clean_output(raw_content:str) -> str:
    """Cleans up Markdown code block fences."""
    match = re.search(r'```(?:json)?\s*({.*?})\s*```', raw_content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return re.sub(r"^```(?:json)?|```$", "", raw_content.strip(), flags=re.MULTILINE).strip()

def calculate_matching_variants(product: ProductModel, user_filters: dict[str, str]) -> tuple[int, list[str]]:
    """
    Counts how many variants of a product match the user's search filters.
    """
    if not user_filters:
        return 0, []

    count = 0
    matching_urls = [] 
    for variant in product.variants:
        is_match = True

        # Combine the parent's common specs with the variant's specific specs
        full_specs = {**(product.common_specs or {}), **(variant.variant_specs or {})}
        for name, value in user_filters.items():
            filter_name = name.lower()
            filter_value = value.lower()
            if 'цена' in filter_name or 'price' in filter_name:
                try:
                    min_price, max_price = map(float, filter_value.replace(" ", "").split('-'))
                    variant_price = variant.latest_lowest_price_record.price if variant.latest_lowest_price_record else None
                    if variant_price is None or not (min_price <= variant_price <= max_price):
                        is_match = False
                        break 
                except (ValueError, IndexError):
                    # handle cases where the price range format is invalid
                    is_match = False
                    break
                continue 

            # spec_key = filter_name.replace(" ", "_") # e.g., "ram памет" -> "ram_памет"
            # variant_spec_value = full_specs.get(spec_key, "").lower()

            # if filter_value not in variant_spec_value:
            #     is_match = False
            #     print("SMT1")
            #     break 

        if is_match:
            count += 1
            matching_urls.append(variant.source_url)
            
    return count, matching_urls