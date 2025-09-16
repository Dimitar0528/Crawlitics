from pydantic import BaseModel, Field, StringConstraints, ConfigDict
from typing import  Annotated

from typing import List, Optional

class PriceHistorySchema(BaseModel):
    price: Optional[float] = None
    currency: Optional[str] = None

    # this allows the Pydantic model to be created from an ORM object
    model_config = ConfigDict(from_attributes=True)


class ProductVariantSchema(BaseModel):
    id: int
    product_id: int
    source_url: str
    image_url: Optional[str] = None
    availability: str
    latest_lowest_price_record: Optional[PriceHistorySchema] = None

    model_config = ConfigDict(from_attributes=True)


class ProductSchema(BaseModel):
    id: int
    name: str
    slug: str
    category: Optional[str] = None
    variants: List[ProductVariantSchema] = []

    matchingVariantCount: Optional[int] = None
    matchingVariantUrls: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)

class Filter(BaseModel):
    name: Annotated[
                str,
                StringConstraints(
                    strip_whitespace=True, min_length=1, max_length=50
                ),
            ] = Field(
        ..., description="Filter name"
    )
    value: Annotated[
                str,
                StringConstraints(
                    strip_whitespace=True, min_length=1, max_length=100
                ),
            ] = Field(
        ..., description="Filter value"
    )

class SearchPayload(BaseModel):
    product_name: Annotated[
                str,
                StringConstraints(
                    strip_whitespace=True, min_length=1, max_length=100
                ),
            ] = Field(
        ..., description="Product name to search for"
    )
    product_category: Annotated[
                str,
                StringConstraints(
                    strip_whitespace=True, min_length=1, max_length=50
                ),
            ] = Field(
        ..., description="Category name"
    )

    filters: list[Filter] = Field(default_factory=list)