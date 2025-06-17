import json
import re
import os
import psycopg2
from psycopg2.extensions import connection
PROPOSED_SCHEMA_DIR = "proposed_schemas"
DB_CONFIG = {
    'host': os.getenv("DB_HOST"),
    'port': os.getenv("DB_PORT"),
    'dbname': os.getenv("DB_NAME"),
    'user': os.getenv("DB_USER"),
    'password': os.getenv("DB_PASSWORD"),
}

def truncate_markdown(content: str):
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.strip().startswith('###') and not line.strip().startswith('##'):
            return '\n'.join(lines[:i])
    return content

def clean_output(raw_content:str) -> str:
    match = re.search(r'```(?:json)?\s*({.*?})\s*```', raw_content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return re.sub(r"^```(?:json)?|```$", "", raw_content.strip(), flags=re.MULTILINE).strip()

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
                "description": "A concise, human-readable summary of the product’s key features, specifications, and benefits, written in natural language. This should highlight what makes the product useful or unique, based only on the content provided in the markdown."
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
            "required": ["name", "brand", "price", "specs"]
    }
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(proposed_schema, f, indent=4, ensure_ascii=False)
    
    print(f"  [Schema Gen] Success! New schema saved to: {filepath}")

def get_db_connection() -> connection | None:
    """Establishes and returns a new database connection."""
    try:
        conn: connection = psycopg2.connect(**DB_CONFIG)
        print(" Successfully connected to PostgreSQL database.")
        return conn
    except psycopg2.OperationalError as e:
        print(f" Failed to connect to PostgreSQL. Please check your DB_CONFIG and ensure the server is running.")
        print(f"Error: {e}")
        return None
    
# Helper func to setup db table
def setup_database(connection: connection):
    """Creates the products table if it doesn't already exist using raw SQL."""
    print("  [DB] Setting up database table...")
    create_table_query = """
    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        source_url VARCHAR(2048) NOT NULL UNIQUE,
        name VARCHAR(512) NOT NULL,
        brand VARCHAR(100),
        price DECIMAL(10, 2),
        category VARCHAR(50) NOT NULL,
        product_description TEXT,
        specs JSONB,
        last_scraped_at TIMESTAMPTZ DEFAULT NOW()
        
    );
    """
    with connection.cursor() as cursor:
        cursor.execute(create_table_query)
    connection.commit() # Save the changes
    print("  [DB] Table 'products' is ready.")

def map_db_row_to_schema_format(row_dict: dict) -> dict | None:
    """
    Converts a flat dictionary from a database row back into the
    nested structure expected by the JSON schemas for validation.
    """
    if not row_dict:
        return None

    category: str = row_dict.get("category")
    
    specs_data = row_dict.get("specs")
    if isinstance(specs_data, str):
        try:
            specs_data = json.loads(specs_data)
        except json.JSONDecodeError:
            specs_data = None 
    
    # Re-assemble the object based on its category
    if category == "Unknown":
        rehydrated_object = {
            "product_name": row_dict.get("name"),
            "price": str(row_dict.get("price")),
            "guessed_category": row_dict.get("guessed_category", category), 
            "product_description": row_dict.get("product_description"),
            "attributes": specs_data
        }
    else:
        rehydrated_object = {
            "name": row_dict.get("name"),
            "brand": row_dict.get("brand"),
            "price": str(row_dict.get("price")),
            "product_description": row_dict.get("product_description"),
            "specs": specs_data
        }

    rehydrated_object['source_url'] = row_dict.get('source_url')
    rehydrated_object['detected_category'] = category
    
    return rehydrated_object