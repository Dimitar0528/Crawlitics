from decimal import Decimal
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
import json
from typing import Literal

from .models import Product, PriceHistory
from .helpers import generate_unique_slug, SessionLocal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import func

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