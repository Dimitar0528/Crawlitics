import json
import re
import os
from jsonschema import validate, ValidationError

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError

from db_models import Product, Base 
from product_schemas import SCHEMAS

from dotenv import load_dotenv
load_dotenv()

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
        return float(cleaned)
    except ValueError:
        return 0.0
    
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
        "price": {"type": "string"},
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

def setup_database():
    """Creates all tables defined in db_models.py if they don't exist."""
    print("  [DB ORM] Setting up database tables via SQLAlchemy...")
    try:
        Base.metadata.create_all(bind=engine)
        print("  [DB ORM] Tables are ready.")
    except Exception as e:
        print(f"  [DB ORM] Error setting up tables: {e}")
        raise

def save_record_to_db(session: Session, data: dict[str, any]) -> None:
    """
    Saves a product's data to the database using the PostgreSQL Python ORM.
    """
    source_url = data.get("source_url")
    if not source_url: return

    print(f"  [DB ORM] Preparing to save data for {source_url}...")
    
    name = data.get("name") or data.get("product_name")
    if not name:
        print(f"  [DB ORM] ❌ Skipping save for {source_url}: 'name' is missing.")
        return
    
    brand = data.get("brand")
    category = data.get("product_category")
    description = data.get("product_description")
    price_str = data.get("price") or "0"
    price_numeric = parse_price(price_str)
    specs_data = data.get("specs") or data.get("attributes")

    # --- ORM "Upsert" Logic ---
    existing_product = session.query(Product).filter(Product.source_url == source_url).first()
    
    if existing_product:
        print(f"  [DB] ⏩ Skipped. Data for {source_url} already exists.")
        return
    else:
        print(f"  [DB] Creating new product object...")
        new_product = Product(
            source_url=source_url,
            name=name,
            brand=brand,
            price=price_numeric,
            category=category,
            product_description=description,
            specs=specs_data
        )
        session.add(new_product)

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

def read_record_from_db(urls: list[str]) -> tuple[dict[str, any], list[str]]:
    """Reads URLs from the database using the ORM and validates them."""
    if not urls: return {}, []

    print(f"\n[DB ORM Read] Checking for {len(urls)} URLs in the database...")
    found_products_map = {}
    
    with SessionLocal() as session:
        query_results = session.query(Product).filter(Product.source_url.in_(urls)).all()

        for product_obj in query_results:
            rehydrated_json = map_db_row_to_schema_format(product_obj)
            category = rehydrated_json.get("product_category")
            schema_to_validate = SCHEMAS.get(category)
            
            try:
                if schema_to_validate:
                    validate(instance=rehydrated_json, schema=schema_to_validate)
                    found_products_map[product_obj.source_url] = rehydrated_json
            except ValidationError as e:
                print(f"  [DB Read] WARNING: Cached data for {product_obj.source_url} is invalid vs current schema. It should be re-scraped. {e}")

    urls_not_found = [url for url in urls if url not in found_products_map]
    return found_products_map, urls_not_found

def map_db_row_to_schema_format(row_obj: Product) -> dict | None:
    """
    Converts a SQLAlchemy Product instance back into the
    nested structure expected by the JSON schemas for validation.
    """
    if not row_obj:
        return None

    category = row_obj.category
    
    specs_data = row_obj.specs
    if isinstance(specs_data, str):
        try:
            specs_data = json.loads(specs_data)
        except json.JSONDecodeError:
            specs_data = None 
        
    rehydrated_object = {
        "name": row_obj.name,
        "brand": row_obj.brand,
        "price": str(row_obj.price),
        "product_description": row_obj.product_description,
        "specs": specs_data
    }

    rehydrated_object['source_url'] = row_obj.source_url
    rehydrated_object['product_category'] = category
    
    return rehydrated_object
