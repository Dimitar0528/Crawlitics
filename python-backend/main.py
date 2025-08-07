from fastapi import Body, FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

from contextlib import asynccontextmanager
from db.crud import (
    get_newest_products,
    get_product_by_slug,
    get_product_variants_for_comparison
)
from db.helpers import get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    from db.helpers import initialize_database_on_first_run
    initialize_database_on_first_run()
    yield 

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/api/latest-products")
def read_latest_products( session: Session = Depends(get_db)):
    newest_products = get_newest_products(session)
    if newest_products is None:
        raise HTTPException(status_code=404, detail="Products not found")
    return newest_products

@app.get("/api/product/{slug}")
def read_product(slug: str, session: Session = Depends(get_db)):
    product = get_product_by_slug(session, slug)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/api/crawleebot")
async def read_product(
    payload = Body(...), 
    session: Session = Depends(get_db)
):
    print(f"Payload from body: {payload}") 
    return {"message": "Започване на анализ..."}

@app.get("/api/compare-products")
def get_comparison_data(ids_str: str = Query(..., alias="ids"), session: Session = Depends(get_db)):
    if not ids_str:
        raise HTTPException(status_code=400, detail="Query parameter 'ids' cannot be empty.")
    try:
        # Split the string by commas and convert each part to an integer.
        variant_ids = [int(id_str.strip()) for id_str in ids_str.split(',')]
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Invalid format for 'ids' parameter. Please provide a comma-separated list of integers."
        )
    variants_to_compare = get_product_variants_for_comparison(session, variant_ids)
    if not variants_to_compare:
        raise HTTPException(status_code=404, detail="None of the provided variant IDs could be found.")
    return variants_to_compare

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
