from decimal import Decimal
from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload, load_only, joinedload
from sqlalchemy.sql import func, select
from sqlalchemy.exc import IntegrityError
from slugify import slugify

from typing import Literal
from datetime import datetime, timedelta, timezone

from .models import Product, ProductVariant, PriceHistory, ProductCategorySchema
from .helpers import generate_unique_slug, SessionLocal

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
    price = data.get("price")
    currency = data.get("currency")
    price_entry = PriceHistory(price=price, currency=currency)
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

def create_product_category_schema(session: Session, category: str, schema_def: dict[str, any]) -> ProductCategorySchema:
    """
    Creates product category schema in the database.
    """
    print(f"Creating a new schema for category: '{category}'")
    db_schema = ProductCategorySchema(
        product_category=category,
        schema_definition=schema_def
    )
    session.add(db_schema)

    try:
        session.commit()
    except IntegrityError:
        print(f"  [DB] Integrity error (likely a race condition). Rolling back.")
        session.rollback()
    except Exception as e:
        print(f"  [DB] An unexpected error occurred: {e}. Rolling back.")
        session.rollback()
        raise

    return db_schema

def get_products_by_category(session: Session, category: str):
    """
    Returns a list of Product objects filtered by category,
    loading only the fields needed to display them as preview cards.
    """

    stmt = (
        select(Product)
        .where(Product.category == category)
        .options(
            load_only(
                Product.id,     
                Product.name,
                Product.slug,
                Product.category,
            ),
            selectinload(Product.variants).load_only(
                ProductVariant.id,        
                ProductVariant.product_id,
                ProductVariant.image_url,
                ProductVariant.availability  
            ),
            selectinload(Product.variants).selectinload(ProductVariant.latest_lowest_price_record).load_only( 
                PriceHistory.price, 
                PriceHistory.currency
            )
        )
        .order_by(Product.created_at.desc())
    )

    result = session.execute(stmt)
    return result.scalars().all()

def get_newest_products(session: Session, limit: int = 20) -> list[Product]:
    """
    Reads the newest parent products, loading only the essential fields 
    required to display them as product cards on the home page.
    """
    stmt = (
        select(Product)
        .options(
            load_only(
                Product.id,     
                Product.name,
                Product.slug,
                Product.category,
            ),
            selectinload(Product.variants).load_only(
                ProductVariant.id,        
                ProductVariant.product_id,
                ProductVariant.image_url,
                ProductVariant.availability  
            ),
            selectinload(Product.variants).selectinload(ProductVariant.latest_lowest_price_record).load_only( 
                PriceHistory.price, 
                PriceHistory.currency
            )
        )
        .order_by(Product.created_at.desc())
        .limit(limit)
    )
    result = session.execute(stmt)
    return result.scalars().all()

def get_product_by_slug(session: Session, slug: str) -> Product:
    """Fetches a single product and its variants and their price history by its slug."""
    stmt = (
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.price_history)
        )
        .where(Product.slug == slug)
    )
    result = session.execute(stmt).scalars().first()
    return result

def get_product_variants_for_comparison(session: Session, variant_ids: list[int]) -> list[ProductVariant]:
    """
    Fetches variants by their IDs, loading only specific columns for the variant,
    its latest price, and its parent product in the most efficient way.
    """
    stmt = (
        select(ProductVariant)
        .options(
            load_only(
                ProductVariant.slug,
                ProductVariant.image_url,
                ProductVariant.availability,
                ProductVariant.variant_specs
            ),
            selectinload(ProductVariant.latest_lowest_price_record).load_only(
                PriceHistory.price,
                PriceHistory.currency
            ),
            # eagerly load the PARENT product with specific columns using join 
            joinedload(ProductVariant.parent_product).load_only(
                Product.name,
                Product.common_specs,
                Product.slug
            )
        )
        .where(ProductVariant.id.in_(variant_ids))
    )
    
    return session.execute(stmt).scalars().unique().all()

def search_products(
    session: Session,
    query: str | None = None,
    offset: int = 0,
    limit: int = 20,
):
    """Return paginated products.
    """
    stmt = (
        select(Product)
        .order_by(Product.id.asc())
        .offset(offset)
        .limit(limit)
        .options(
            load_only(
                Product.id,
                Product.name,
                Product.slug,
                Product.category,
            ),
            selectinload(Product.variants).load_only(
                ProductVariant.id,
                ProductVariant.product_id,
                ProductVariant.image_url,
                ProductVariant.availability,
            ),
            selectinload(Product.variants).selectinload(ProductVariant.latest_lowest_price_record).load_only(
                PriceHistory.price,
                PriceHistory.currency,
            ),
        )
    )
    if query:
        q = f"%{query}%"
        stmt = stmt.where(
            or_(
                Product.name.ilike(q),
            )
        )
    result = session.execute(stmt)
    return result.scalars().all()

def get_parent_product_by_name(session: Session, name: str) -> Product:
    """Fetches a single parent product by its exact name."""
    stmt = select(Product).options(selectinload(Product.variants)).where(Product.name == name)
    result = session.execute(stmt).scalars().first()
    return result

def get_product_variant_by_url(session: Session, url: str) -> ProductVariant:
    """Fetches a single product variant by its source URL."""
    stmt = select(ProductVariant).where(ProductVariant.source_url == url)
    result = session.execute(stmt).scalars().first()
    return result

def read_products_from_db(
    urls: list[str], 
    cache_duration_hours: int = 24
) -> tuple[list[Product], list[str]]:
    """
    Reads a list of product variants from the DB by URL, returning fresh data and a list of stale/missing URLs.

    This function checks if a variant was scraped recently. If it's "fresh", it returns the full
    parent Product object. If it's "stale" or not found, it adds the URL to a list
    to be re-scraped.
    """
    if not urls:
        return [], []

    print(f"\n[DB Read] Checking cache for {len(urls)} URLs...")
    cache_duration = timedelta(hours=cache_duration_hours)

    fresh_parent_product_ids: set[int] = set()
    freshly_found_urls: set[str] = set()
    with SessionLocal() as session:
        stmt = (
            select(ProductVariant)
            .options(
                selectinload(ProductVariant.parent_product).load_only(Product.id)
            )
            .where(ProductVariant.source_url.in_(urls))
        )
        query_results = session.execute(stmt).scalars().all()

        for variant in query_results:
            is_stale = (datetime.now(timezone.utc) - variant.last_scraped_at) > cache_duration
            
            if is_stale:
                print(f"  - Stale URL: {variant.source_url}. (Queuing for re-scrape)")
                continue
            
            fresh_parent_product_ids.add(variant.parent_product.id)
            freshly_found_urls.add(variant.source_url)

        found_products: list[Product] = []
        if fresh_parent_product_ids:
            # now fetch the full product objects with the desired structure
            stmt_products = (
                select(Product)
                .where(Product.id.in_(list(fresh_parent_product_ids)))
                .options(
                    load_only(
                        Product.id,
                        Product.name,
                        Product.slug,
                        Product.category,
                    ),
                    selectinload(Product.variants).load_only(
                        ProductVariant.id,
                        ProductVariant.product_id,
                        ProductVariant.image_url,
                        ProductVariant.availability
                    ),
                    selectinload(Product.variants).selectinload(ProductVariant.latest_lowest_price_record).load_only(
                        PriceHistory.price,
                        PriceHistory.currency
                    )
                )
            )
            found_products = session.execute(stmt_products).scalars().all()


    all_input_urls = set(urls)
    urls_to_scrape = list(all_input_urls - freshly_found_urls)
    
    print(f"[DB Read] Found {len(found_products)} fresh product records.")
    print(f"[DB Read] Queuing {len(urls_to_scrape)} URLs for scraping.")

    return found_products, urls_to_scrape

def get_schema_by_product_category(session: Session, category: str) -> dict[str, any]:
    """Retrieves the current schema for a given product category."""
    stmt = select(ProductCategorySchema.schema_definition).where(ProductCategorySchema.product_category == category)
    result = session.execute(stmt).scalars().first()
    return result



def get_all_categories(session: Session) -> list[dict[str, str]]:
    """Return distinct product categories with URL slugs."""
    stmt = (
        select(Product.category)
        .where(Product.category.is_not(None))
        .distinct()
        .order_by(Product.category.asc())
    )
    categories: list[str] = session.execute(stmt).scalars().all()
    return [
        {"name_bg": category, "slug": slugify(category)}
        for category in categories
        if isinstance(category, str) and category.strip()
    ]

def update_product_variant(
    session: Session,
    variant: ProductVariant,
    new_price: float | None,
    new_availability: Literal['Неясен', 'В наличност', 'Изчерпан']
) -> None:
    """Updates a product's dynamic data (price and availability) based on fresh scrape data."""
    
    latest_price = variant.price_history[-1].price if variant.price_history else None
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