from slugify import slugify
import random
import string
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from .models import Product, Base 

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?client_encoding=utf8"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
        yield db # Provide the session to the FastAPI route
    finally:
        db.close() # Ensure the session is closed after the request
