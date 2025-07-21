from sqlalchemy import Column, Integer, String, DECIMAL, TEXT, TIMESTAMP, ForeignKey, select,  and_
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, relationship, remote, foreign
from sqlalchemy.sql import func

Base = declarative_base()

class Product(Base):
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True)
    name = Column(String(256), unique=True, nullable=False)
    slug = Column(String(256), nullable=False, unique=True, index=True)
    brand = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(TEXT, nullable=True)
    common_specs = Column(JSONB, nullable=False)
    variants = relationship("ProductVariant", back_populates="parent_product", cascade="all, delete-orphan")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}')>"
    
class ProductVariant(Base):
    __tablename__ = 'product_variants'

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False, index=True)
    source_url = Column(String(512), nullable=False, unique=True)
    slug = Column(String(128), nullable=False, unique=True, index=True)
    availability = Column(String(20), nullable=False)
    image_url = Column(String(512), nullable=True)
    variant_specs = Column(JSONB, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    last_scraped_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    # This product variant has a one-to-many relationship with its price history.
    price_history = relationship(
        "PriceHistory",
        back_populates="variant",
        cascade="all, delete-orphan"
    )
    latest_lowest_price_record = relationship(
        "PriceHistory",
        primaryjoin=lambda: and_(
            # this part defines the link between the two tables
            ProductVariant.id == remote(foreign(PriceHistory.variant_id)),
            
            # this part identifies the specific remote record we want
            remote(PriceHistory.id) == (
                select(PriceHistory.id)
                .where(PriceHistory.variant_id == ProductVariant.id)
                .order_by(
                    PriceHistory.price.desc(),
                    PriceHistory.recorded_at.desc()
                )
                .limit(1)
                .correlate(ProductVariant.__table__)
                .scalar_subquery()
            )
        ),
        uselist=False,
        viewonly=True,
    )
    parent_product = relationship("Product", back_populates="variants")

    def __repr__(self):
        return f"<Variant(url='{self.source_url}', specs='{self.variant_specs}')>"

class PriceHistory(Base):
    __tablename__ = 'price_history'

    id = Column(Integer, primary_key=True, autoincrement=True)
    variant_id = Column(Integer, ForeignKey('product_variants.id'), nullable=False, index=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='BGN', index=True)
    recorded_at = Column(
        TIMESTAMP(timezone=True), 
        nullable=False, 
        server_default=func.now()
    )
    variant = relationship("ProductVariant", back_populates="price_history")

    def __repr__(self):
         return f"<PriceHistory(product_id={self.product_id}, price={self.price})>"