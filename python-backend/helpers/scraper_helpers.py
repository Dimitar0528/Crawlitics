import json
import re
import os
from typing import Literal

PROPOSED_SCHEMA_DIR = "proposed_schemas"

def parse_price(price_str: str) -> float:
    cleaned = (price_str or "0").lower().replace("лв.", "").replace("лв", "").strip()

    cleaned = re.sub(r"[^\d.,]", "", cleaned)

    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")

    try:
        value = float(cleaned)
        return "{:.2f}".format(value)
    except ValueError:
        return 0.0
    
def extract_dynamic_data_from_markdown(markdown: str, exlude_price=False, exclude_availability=False) -> tuple[float | None, Literal['Неясен', 'В наличност', 'Изчерпан'] | None]:
    """
    Reads markdown and extracts the product price and availability status.
    Allows for excluding either extraction task via flags.

    Args:
        markdown: The extracted markdown from the page.
        exclude_price: If True, price extraction will be skipped.
        exclude_availability: If True, availability extraction will be skipped.

    Returns:
        A tuple containing:
        - A product price, converted to float, or None if excluded.
        - The availability status string or None if excluded.
    """
    extracted_price: float | None = None
    extracted_availability: Literal['Неясен', 'В наличност', 'Изчерпан'] | None = None

    if not exlude_price:
        target_currencies = ['лв', 'EUR', '$', '€']

        currency_pattern_part = '|'.join(re.escape(c) for c in target_currencies)
        price_pattern = re.compile(
        rf"""
        ^(?!.*ПЦД)                  # Skip line if it contains 'ПЦД'
        .*?                         # Match any characters (non-greedy) up to the price (this skips text before price)
        \b                          # Word boundary to ensure price starts cleanly (not part of a larger word)
        (                           # Capture group for full price number
        (?:                       # Non-capturing group for integer part with thousands
            [1-9]\d{{0,2}}          # Match integer part starting with non-zero digit, followed by 0 to 2 digits
            (?:[\s'\.]\d{{3}})*     # Match zero or more thousands groups separated by space, apostrophe, or dot
        )
        (?:                       # Require decimal part (mandatory for a valid match)
            [.,]\d{{2}}             # Match decimal separator (dot or comma), followed by exactly two digits
        )
        )                           # End capture group for the price
        \s*                         # Optional whitespace after the price
        (?:{currency_pattern_part}) # Match the currency (injected dynamically)
        \b                          # Word boundary to ensure currency ends cleanly
        """,
        re.IGNORECASE | re.VERBOSE | re.MULTILINE
    )
        matches = price_pattern.findall(markdown)
        extracted_price = [parse_price(match) for match in matches][0]

    if not exclude_availability:
        negative_lookbehind = r'(?<!вече\s)' 
        
        izcherpan_pattern = negative_lookbehind + r'изчерпан'

        # define other unavailable keywords
        other_unavailable = {'не е наличен', 'out of stock'}
        
        # combine all parts into the final regex
        unavailable_parts = [izcherpan_pattern]
        unavailable_parts.extend(re.escape(k) for k in other_unavailable)

        AVAILABLE_KEYWORDS = {
            'на склад',        
            'в наличност',
            "ограничена наличност",
            'при доставчик',
            "последни",
            "последен",
            'in stock',
        }
        lower_content = markdown.lower()
        unavailable_pattern = r'\b(' + '|'.join(unavailable_parts) + r')\b'
        if re.search(unavailable_pattern, lower_content):
            extracted_availability = "Изчерпан"

        available_pattern = r'\b(' + '|'.join(re.escape(k) for k in AVAILABLE_KEYWORDS) + r')\b'
        if re.search(available_pattern, lower_content):
            extracted_availability = "В наличност"
        if not extracted_availability:
            extracted_availability = "Неясен"
    return extracted_price, extracted_availability

def generate_and_save_product_schema(data: dict[str,any]):
    """
    Analyzes an 'Unknown' product's data and saves a proposed JSON schema for it.
    """
    guessed_category: str = data.get("guessed_category", "new_product").strip()
    if not guessed_category:
        guessed_category = "unnamed_category"
        
    # Sanitize the category name to create a valid filename
    filename = re.sub(r'[^\w-]', '_', guessed_category) + ".json"
    filepath = os.path.join(PROPOSED_SCHEMA_DIR, filename)

    print(f"  [Schema Gen] Generating a new schema proposal for '{guessed_category}'...")

    attributes: dict[str, str] = data.get("attributes", {})
    if not attributes:
        print("  [Schema Gen] No attributes found to generate a schema.")
        return

    # Build the 'properties' part of the new schema
    new_properties = {
        "name": {"type": "string"},
        "brand": {"type": "string"},
        "price": {"type": "number"},
        "product_description": {
                "type": "string",
                "description": "A concise, human-readable summary of the product’s key features, specifications, and benefits, written in natural language. This should highlight what makes the product useful or unique, based only on the content provided in the markdown. The description must be in Bulgarian."
            },
        "specs": {
            "type": "object",
            "properties": {
                key: {"type": "string"} for key in attributes.keys()
            },
        }
    }

   # Full schema structure
    proposed_schema = {
            "type": "object",
            "properties": new_properties,
            "required": ["name", "brand", "price", "product_description", "specs"]
    }
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(proposed_schema, f, indent=4, ensure_ascii=False)
    
    print(f"  [Schema Gen] Success! New schema saved to: {filepath}")
