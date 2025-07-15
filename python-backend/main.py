from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
from db.crud import read_newest_records_from_db

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

@app.get("/api/scrape")
def scrape():
    data = {"product": "Example", "price": 19.99}
    return data

@app.get("/api/products")
def read_products():
    newest_db_products = read_newest_records_from_db()
    if newest_db_products is None:
        raise HTTPException(status_code=404, detail="Products not found")
    return newest_db_products
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
