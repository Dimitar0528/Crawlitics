import asyncio
from fastapi import Body, FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect,BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import unquote

 
from sqlalchemy.orm import Session

import uuid

from contextlib import asynccontextmanager
from db.crud import (
    get_newest_products,
    get_product_by_slug,
    get_products_by_category,
    get_product_variants_for_comparison,
    get_all_categories,
    search_products,
)
from db.helpers import get_db
from configs.pydantic_models import SearchPayload
from scraper import scrape_sites  

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

@app.post("/api/category-products")
async def read_products_by_category(
    category: str = Body(..., embed=True),
    session: Session = Depends(get_db)
):
    decoded_category = unquote(category)
    products = get_products_by_category(session, decoded_category)
    if not products:
        raise HTTPException(status_code=404, detail="Products not found for this category")

    return products


@app.get("/api/categories")
def read_categories(session: Session = Depends(get_db)):
    categories = get_all_categories(session)
    if not categories:
        raise HTTPException(status_code=404, detail="Products categories not found")

    return categories


@app.get("/api/search-products")
def read_search_products(
    q: str | None = Query(None, alias="q"),
    offset: int = Query(0),
    limit: int = Query(20),
    session: Session = Depends(get_db),
):
    products = search_products(
        session,
        query=q,
        offset=offset,
        limit=limit,
    )
    if not products:
         raise HTTPException(status_code=404, detail="Search products not found")
    return products

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, task_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[task_id] = websocket
        print(f"WebSocket connected for task {task_id}")

    def disconnect(self, task_id: str):
        if task_id in self.active_connections:
            del self.active_connections[task_id]
            print(f"WebSocket disconnected for task {task_id}")

    async def send_json_update(self, task_id: str, message: dict):
        if task_id in self.active_connections:
            await self.active_connections[task_id].send_json(message)

manager = ConnectionManager()

tasks = {}


# dummy CrawleeBot function that simulates work
async def run_crawleebot_task(task_id: str, payload: SearchPayload):
    """A long-running task that simulates the CrawleeBot process."""
    print(f"Starting task {task_id} for query: {payload.product_name}")
    tasks[task_id] = {"status": "STARTED", "message": "Мисията започна..."}

    await scrape_sites(payload)
    
    tasks[task_id] = {"status": "COMPLETE", "data": [
        {"id": 1, "name": "Примерен Продукт 1", "price": 1299},
        {"id":2,"name": "Примерен Продукт 2", "price": 1399},
    ]}
    print(f"Task {task_id} completed.")

@app.post("/api/start-analysis")
async def start_analysis(payload: SearchPayload, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "PENDING", "message": "Задачата е създадена..."}
    if not payload.product_name.strip():
        raise HTTPException(status_code=400, detail="Product name cannot be empty")
    if not payload.product_category.strip():
        raise HTTPException(status_code=400, detail="Product category cannot be empty")
    if len(payload.filters) == 0:
        raise HTTPException(status_code=400, detail="At least one product filter required")
    if len(payload.filters) > 10:
        raise HTTPException(status_code=400, detail="Too many filters provided")
        
    background_tasks.add_task(run_crawleebot_task, task_id, payload)

    return {"task_id": task_id}

@app.websocket("/ws/analysis/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await manager.connect(task_id, websocket)
    try:
        while task_id in tasks and tasks[task_id].get("status") != "COMPLETE":
            # send the current status of the task
            current_status = tasks.get(task_id, {})
            await manager.send_json_update(task_id, current_status)
            await asyncio.sleep(1) # Check for updates every second

        if task_id in tasks:
            await manager.send_json_update(task_id, tasks[task_id])

    except WebSocketDisconnect:
        manager.disconnect(task_id)
    finally:
        if task_id in tasks:
            del tasks[task_id]
            
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
