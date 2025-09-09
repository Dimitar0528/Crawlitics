from pydantic import BaseModel, Field, StringConstraints, model_validator
from typing import  Annotated

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