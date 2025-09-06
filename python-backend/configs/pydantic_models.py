from pydantic import BaseModel

class Filter(BaseModel):
    name: str
    value: str

class SearchPayload(BaseModel):
    product_name: str
    product_category: str
    filters: list[Filter] = []