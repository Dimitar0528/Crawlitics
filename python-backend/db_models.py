from sqlalchemy import Column, Integer, String, DECIMAL, TEXT, TIMESTAMP, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()

class Product(Base):
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_url = Column(String(512), nullable=False, unique=True)
    name = Column(String(256), nullable=False)
    slug = Column(String(256), nullable=False, unique=True, index=True)
    brand = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)
    availability = Column(String(20), nullable=False)
    description = Column(TEXT, nullable=True)
    specs = Column(JSONB, nullable=False)
    image_url = Column(String(512), nullable=True)
    created_at = Column(
        TIMESTAMP(timezone=True), 
        nullable=False,
        server_default=func.now()
    )
    last_scraped_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(), 
        onupdate=func.now()
    )
    price_history = relationship(
        "PriceHistory", 
        back_populates="product", 
        cascade="all, delete-orphan",
        order_by="PriceHistory.recorded_at.desc()"
    )

    def __repr__(self):
        return f"<Product(name='{self.name}', brand='{self.brand}, price={self.price_history}')>"
    
    def to_json(self) -> dict:
        return {
            "source_url": self.source_url,
            "name": self.name,
            "slug": self.slug,
            "brand": self.brand,
            "category": self.category,
            "availability": self.availability,
            "description": self.description,
            "specs": self.specs,
            "last_scraped_at": self.last_scraped_at.isoformat() if self.last_scraped_at else None,
            "price_history": [ph.to_json() for ph in self.price_history] if self.price_history else [],
        }
class PriceHistory(Base):
    __tablename__ = 'price_history'

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False, index=True)
    price = Column(DECIMAL(10, 2), nullable=False)


    recorded_at = Column(
        TIMESTAMP(timezone=True), 
        nullable=False, 
        server_default=func.now()
    )

    product = relationship("Product", back_populates="price_history")

    def __repr__(self):
        return f"<PriceHistory(product_id={self.product_id}, price={self.price})>"
    
    def to_json(self) -> dict:
        return {
            "price": float(self.price) if self.price is not None else None,
            "recorded_at": self.recorded_at.isoformat() if self.recorded_at else None,
        }