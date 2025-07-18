from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session

from contextlib import asynccontextmanager
from db.crud import get_newest_products
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

@app.get("/api/scrape")
def scrape():
    data = {"product": "Example", "price": 19.99}
    return data

@app.get("/api/products")
def read_products( session: Session = Depends(get_db)):
    newest_db_products = get_newest_products(session)
    if newest_db_products is None:
        raise HTTPException(status_code=404, detail="Products not found")
    return newest_db_products
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
