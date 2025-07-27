import json
import re
import os
from typing import Literal

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