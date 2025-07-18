from slugify import slugify
import random
import string
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker, Session

from .models import Product, ProductVariant, Base 

from typing import Type

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?client_encoding=utf8"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

BaseModel = Type[Product | ProductVariant]

def generate_unique_slug(
    session: Session,
    model: BaseModel,
    source_data: str | dict[str, str],
    product_id: int = None
) -> str:
    """
    Generates a unique slug for a given SQLAlchemy model.

    - If source_data is a string, it slugifies the string.
    - If source_data is a dictionary, it combines and sorts the values to create a slug.
    - It ensures the generated slug is unique within the specified model's table.
    
    Args:
        session: The SQLAlchemy session object.
        model: The SQLAlchemy model class (e.g., Product or ProductVariant).
        source_data: The data to create the slug from (a string name or a dict of specs).
        product_id: Optional. For ProductVariant, this is the parent product's ID
                    to ensure the slug is unique *within that product's variants*.
    """
    base_slug = ""
    
    if isinstance(source_data, str):
        # generating slug for a parent Product from its name
        base_slug = slugify(source_data)
        
    elif isinstance(source_data, dict):
        # generating slug for a ProductVariant from its sorted spec keys
        sorted_keys = sorted(source_data.keys())
        slug_parts = [slugify(str(source_data.get(key, ''))) for key in sorted_keys]
        base_slug = "-".join(part for part in slug_parts if part)
    
    slug = base_slug
    while True:
        query = session.query(model.id).filter(model.slug == slug)

        if model is ProductVariant and product_id is not None:
            query = query.filter(ProductVariant.product_id == product_id)
            
        existing = query.first()
        
        if not existing:
            return slug
        
        # Generate a new slug with random suffix
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
        slug = f"{base_slug}-{random_suffix}"

def setup_database():
    """Creates all tables defined in models.py if they don't exist."""
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

def get_db():
    db = SessionLocal()
    try:
        yield db # provide the session to the FastAPI route
    finally:
        db.close()