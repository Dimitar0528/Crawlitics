import json
import re
import os
from typing import Literal
from decimal import Decimal

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import func

from db_models import Product, PriceHistory, Base 

from dotenv import load_dotenv
load_dotenv()

from slugify import slugify
import random
import string
from datetime import datetime, timedelta, timezone

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?client_encoding=utf8"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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

def generate_unique_slug(session, name: str) -> str:
    """
    Generates a unique slug for a product name.
    
    If a product with the generated slug already exists, it appends a short
    random string to ensure uniqueness.
    
    Args:
        session: The SQLAlchemy session object.
        name: The product name to slugify.
        product_id_to_ignore: Optional. When updating a product, ignore its own existing slug.
    """
    base_slug = slugify(name)
    slug = base_slug
    # ensure generated slug is unique
    while session.query(Product.id).filter(Product.slug == slug).first():
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
        slug = f"{base_slug}-{random_suffix}"
        
    return slug

def setup_database():
    """Creates all tables defined in db_models.py if they don't exist."""
    print("  [DB ORM] Setting up database tables via SQLAlchemy...")
    try:
        Base.metadata.create_all(bind=engine)
        print("  [DB ORM] Tables are ready.")
    except Exception as e:
        print(f"  [DB ORM] Error setting up tables: {e}")
        raise

def initialize_database_on_first_run():
    """
    Checks if the database tables exist and runs the setup function only
    on the very first run.
    """
    try:
        inspector = inspect(engine)

        # get table names defined in models
        required_tables = set(Base.metadata.tables.keys())
        
        # get table names that actually exist in the database
        existing_tables = set(inspector.get_table_names())

        if required_tables.issubset(existing_tables):
            return 
        else:
            missing = required_tables - existing_tables
            print(f"[Startup] Missing tables detected: {missing}.")
            setup_database()

    except Exception as e:
        print(f"[Startup] FATAL: Could not connect to the database to check tables: {e}")
        print("[Startup] Please ensure the database server is running and accessible.")
        raise

def save_record_to_db(session: Session, data: dict[str, any]) -> None:
    """
    Saves a product's data to the database using the PostgreSQL Python ORM.
    """
    source_url = data.get("source_url")
    if not source_url: return

    print(f"  [DB] Preparing to save data for {source_url}...")
    
    name = data.get("name") or data.get("product_name")
    slug = generate_unique_slug(session, name)
    brand = data.get("brand")
    category = data.get("category")
    availability = data.get("availability")
    description = data.get("product_description")
    price = data.get("price") or "0"
    specs_data = data.get("specs") or data.get("attributes")
    image_url = data.get("image_url")
    # --- ORM "Upsert" Logic ---
    existing_product = session.query(Product).filter(Product.source_url == source_url).first()
    
    if existing_product:
        return
    else:
        print(f"  [DB] Creating new product object...")
        new_product = Product(
            source_url=source_url,
            name=name,
            slug=slug,
            brand=brand,
            category=category,
            availability=availability,
            description=description,
            specs=specs_data,
            image_url= image_url if image_url else None
        )
        session.add(new_product)
        price_entry = PriceHistory(price=price)
        new_product.price_history.append(price_entry)

    try:
        session.commit()
        print(f"  [DB] Successfully saved new data for {source_url}.")
    except IntegrityError:
        print(f"  [DB] Integrity error (likely a race condition). Rolling back.")
        session.rollback()
    except Exception as e:
        print(f"  [DB] An unexpected error occurred: {e}. Rolling back.")
        session.rollback()
        raise

def read_record_from_db(urls: list[str]) -> tuple[list[dict[str, any]], list[str]]:
    """Reads a list of product URLs from the database, returning cached product data if it exists and is fresh enough."""
    if not urls: return [], []

    CACHE_DURATION = timedelta(hours=24)

    print(f"\n[DB ORM Read] Checking for {len(urls)} URLs in the database...")
    found_products: list[dict[str, any]] = []
    successfully_found_urls: set[str] = set()
    with SessionLocal() as session:
        query_results = session.query(Product).filter(Product.source_url.in_(urls)).all()

        for product_obj in query_results:
            product_json_string = json.dumps(product_obj.to_json(), ensure_ascii=False)
            product: dict[str, any] = json.loads(product_json_string)
            source_url = product_obj.source_url
            time_since_last_scrape = datetime.now(timezone.utc) - product_obj.last_scraped_at

            if time_since_last_scrape > CACHE_DURATION:
                print(f" Stale URL: {source_url}. Queuing for update scrape.")
            else:
                found_products.append(product)
                successfully_found_urls.add(source_url)

    urls_not_found = [url for url in urls if url not in successfully_found_urls]
    return found_products, urls_not_found

def update_record_from_db(
    session: Session,
    product_url: str,
    new_price: float | None,
    new_availability: Literal['Неясен', 'В наличност', 'Изчерпан']
) -> None:
    """
    Updates a product's dynamic data (price and availability) based on fresh scrape data.
    """
    print(f"  [DB] Processing data for URL: {product_url}")
    
    try:
        product = session.query(Product).filter(Product.source_url == product_url).first()
        if not product:
            print(f"  [DB] WARNING: Product with URL '{product_url}' not found. Skipping.")
            return

        latest_price_entry = product.price_history[0].price if product.price_history else None
        if latest_price_entry != Decimal(new_price):
            print(f"  [DB] Price changed for '{product.name}'. Old: {latest_price_entry}, New: {new_price}")
            new_price_record = PriceHistory(price=new_price, product_id=product.id)
            session.add(new_price_record)

        if product.availability != new_availability:
            print(f"  [DB] Availability changed for '{product.name}'. Old: {product.availability}, New: {new_availability}")
            product.availability = new_availability

        product.last_scraped_at = func.now()
        try:
            session.commit()
        except IntegrityError:
            print(f"  [DB] Integrity error (likely a race condition). Rolling back.")
            session.rollback()

    except Exception as e:
        print(f"  [DB] An error occurred during product update: {e}")
        session.rollback()
        raise 