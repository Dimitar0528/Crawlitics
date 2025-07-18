from decimal import Decimal
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.sql import func
from sqlalchemy.exc import IntegrityError

from typing import Literal
from datetime import datetime, timedelta, timezone

from .models import Product, ProductVariant, PriceHistory
from .helpers import generate_unique_slug, SessionLocal

def get_parent_product_by_name(session: Session, name: str) -> Product | None:
    """Fetches a single parent product by its exact name."""
    return session.query(Product).filter(Product.name == name).first()

def create_parent_product(session: Session, data: dict[str, any]) -> Product:
    """Creates a new parent product in the database."""
    parent_slug = generate_unique_slug(session, Product, data['name'])
    
    new_product = Product(
        name=data['name'],
        slug=parent_slug,
        brand=data.get('brand'),
        category=data.get('category'),
        description=data.get('description'),
        common_specs=data.get('common_specs')
    )
    
    session.add(new_product)
    try:
        session.commit()
    except IntegrityError:
        print(f"  [DB] Integrity error (likely a race condition). Rolling back.")
        session.rollback()
    except Exception as e:
        print(f"  [DB] An unexpected error occurred: {e}. Rolling back.")
        session.rollback()
        raise

    session.refresh(new_product)
    print(f"  [DB CRUD] Created Parent Product: '{new_product.name}' (ID: {new_product.id})")
    return new_product

def create_product_variant(session: Session, product_id: int, data: dict[str, any]) -> ProductVariant:
    """Creates a new product variant, associated with a parent product."""
    variant_slug_source = data.get('variant_specs') or data.get('source_url')
    variant_slug = generate_unique_slug(
        session, ProductVariant, variant_slug_source, product_id=product_id
    )
    
    new_variant = ProductVariant(
        product_id=product_id,
        source_url=data['source_url'],
        slug=variant_slug,
        availability=data['availability'],
        image_url=data['image_url'],
        variant_specs=data.get('variant_specs', {})
    )
    
    # create the first price history entry for the new variant
    price = data.get("price") or "0"
    price_entry = PriceHistory(price=price)
    new_variant.price_history.append(price_entry)
    
    session.add(new_variant)
    try:
        session.commit()
    except IntegrityError:
        print(f"  [DB] Integrity error (likely a race condition). Rolling back.")
        session.rollback()
    except Exception as e:
        print(f"  [DB] An unexpected error occurred: {e}. Rolling back.")
        session.rollback()
        raise

    print(f"  [DB CRUD] Created Variant for Product ID {product_id} from URL: {data['source_url']}")
    return new_variant

def get_product_variant_by_url(session: Session, url: str) -> ProductVariant | None:
    """Fetches a single product variant by its source URL."""
    return session.query(ProductVariant).filter(ProductVariant.source_url == url).first()

def get_newest_products(session: Session, limit: int = 20) -> list[Product]:
    """Reads the newest parent products, including their variants and price histories."""
    return session.query(Product)\
        .options(selectinload(Product.variants).selectinload(ProductVariant.price_history))\
        .order_by(Product.created_at.desc())\
        .limit(limit)\
        .all()

def read_products_from_db(
    urls: list[str], 
    cache_duration_hours: int = 24
) -> tuple[list[dict[str, any]], list[str]]:
    """
    Reads a list of product variants from the DB by URL, returning fresh data and a list of stale/missing URLs.

    This function checks if a variant was scraped recently. If it's "fresh", it assembles a
    complete product record. If it's "stale" or not found, it adds the URL to a list
    to be re-scraped.
    """
    if not urls:
        return [], []

    print(f"\n[DB Read] Checking cache for {len(urls)} URLs...")
    cache_duration = timedelta(hours=cache_duration_hours)

    found_records: list[dict[str, any]] = []
    freshly_found_urls: set[str] = set()
    with SessionLocal() as session:
    # query variants that match the URLs, and pre-load their parent product and price history
        query_results = session.query(ProductVariant)\
            .options(
                selectinload(ProductVariant.parent_product), 
                selectinload(ProductVariant.price_history)
            )\
            .filter(ProductVariant.source_url.in_(urls))\
            .all()

        for variant in query_results:
            is_stale = (datetime.now(timezone.utc) - variant.last_scraped_at) > cache_duration
            
            if is_stale:
                print(f"  - Stale URL: {variant.source_url}. (Queuing for re-scrape)")
                continue
            
            parent: Product = variant.parent_product
            # combine common and variant specs into a single dictionary
            specs = {**(parent.common_specs or {}), **(variant.variant_specs or {})}
            latest_price = variant.price_history[0].price if variant.price_history else None

            record = {
                "name": parent.name,
                "brand": parent.brand,
                "category": parent.category,
                "description": parent.description,
                "price": float(latest_price),
                "specs": specs,
            }
            found_records.append(record)
            freshly_found_urls.add(variant.source_url)

    all_input_urls = set(urls)
    urls_to_rescrape = list(all_input_urls - freshly_found_urls)
    
    print(f"[DB Read] Found {len(found_records)} fresh records.")
    print(f"[DB Read] Queuing {len(urls_to_rescrape)} URLs for scraping.")

    return found_records, urls_to_rescrape

def update_product_variant(
    session: Session,
    product_url: str,
    new_price: float | None,
    new_availability: Literal['Неясен', 'В наличност', 'Изчерпан']
) -> None:
    """Updates a product's dynamic data (price and availability) based on fresh scrape data."""

    variant = get_product_variant_by_url(session, product_url)

    latest_price = variant.price_history[0].price if variant.price_history else None
    if  latest_price != Decimal(new_price):
        print(f"  [DB CRUD] Price changed for '{variant.slug}'. Old: {latest_price}, New: {new_price}")
        new_price_record = PriceHistory(price=new_price, variant_id=variant.id)
        session.add(new_price_record)

    if variant.availability != new_availability:
        print(f"  [DB CRUD] Availability changed for '{variant.slug}'. Old: {variant.availability}, New: {new_availability}")
        variant.availability = new_availability

    variant.last_scraped_at = func.now()
    try:
        session.commit()
    except IntegrityError:
        print(f"  [DB] Integrity error (likely a race condition). Rolling back.")
        session.rollback()
    except Exception as e:
        print(f"  [DB] An unexpected error occurred: {e}. Rolling back.")
        session.rollback()
        raise