from pydantic import BaseModel, Field, StringConstraints, model_validator
from typing import  Annotated
import re

def sanitize_input(value: str) -> str:
    """Sanitize input to remove dangerous characters."""
    # keep only alphanumerics, basic punctuation, space, dash, underscore
    safe_value = re.sub(r"[^a-zA-Z0-9_\-.,: ]+", "", value)
    return safe_value.strip()

class Filter(BaseModel):
    name: Annotated[
                str,
                StringConstraints(
                    strip_whitespace=True, min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9_\- ]+$"
                ),
            ] = Field(
        ..., description="Filter name (only alphanumeric, spaces, underscores, and hyphens allowed)"
    )
    value: Annotated[
                str,
                StringConstraints(
                    strip_whitespace=True, min_length=1, max_length=100, regex=r"^[a-zA-Z0-9_\-.,: ]+$"
                ),
            ] = Field(
        ..., description="Filter value (restricted to safe characters)"
    )
    @model_validator(mode="before")
    def sanitize_filter(cls, values):
        values['name'] = sanitize_input(values.get('name', ''))
        values['value'] = sanitize_input(values.get('value', ''))
        return values

class SearchPayload(BaseModel):
    product_name: Annotated[
                str,
                StringConstraints(
                    strip_whitespace=True, min_length=2, max_length=100, regex=r"^[a-zA-Z0-9_\- ]+$"
                ),
            ] = Field(
        ..., description="Product name to search for"
    )
    product_category: Annotated[
                str,
                StringConstraints(
                    strip_whitespace=True, min_length=2, max_length=50, regex=r"^[a-zA-Z0-9_\- ]+$"
                ),
            ] = Field(
        ..., description="Category name (restricted to safe characters)"
    )
    @model_validator(mode="before")
    def sanitize_payload(cls, values):
        values['product_name'] = sanitize_input(values.get('product_name', ''))
        values['product_category'] = sanitize_input(values.get('product_category', ''))
        return values

    filters: list[Filter] = Field(default_factory=list)