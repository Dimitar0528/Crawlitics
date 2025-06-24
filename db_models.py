from sqlalchemy import Column, Integer, String, DECIMAL, TEXT, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Product(Base):
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_url = Column(String(2048), nullable=False, unique=True)
    name = Column(String(512), nullable=False)
    brand = Column(String(100))
    price = Column(DECIMAL(10, 2))
    category = Column(String(50), nullable=False)
    product_description = Column(TEXT)
    specs = Column(JSONB) 
    last_scraped_at = Column(TIMESTAMP, server_default=func.now())
    
    def __repr__(self):
        return f"<Product(name='{self.name}', brand='{self.brand}')>"