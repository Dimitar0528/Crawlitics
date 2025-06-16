import asyncio
import json
import re
import time
import os
import ollama
from jsonschema import validate, ValidationError
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig, CacheMode
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.async_dispatcher import MemoryAdaptiveDispatcher, RateLimiter

import psycopg2

from dotenv import load_dotenv
load_dotenv()

from product_schemas import SCHEMAS
PROPOSED_SCHEMA_DIR = "proposed_schemas"
LLM_CONCURRENCY = 2
llm_semaphore = asyncio.Semaphore(LLM_CONCURRENCY)

KNOWN_CATEGORIES = [cat for cat in SCHEMAS if cat != "Unknown"]

DB_CONFIG = {
    'host': os.getenv("DB_HOST"),
    'port': os.getenv("DB_PORT"),
    'dbname': os.getenv("DB_NAME"),
    'user': os.getenv("DB_USER"),
    'password': os.getenv("DB_PASSWORD"),
}
# ----------------------------------------
# HELPERS
# ----------------------------------------
def truncate_markdown(content):
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.strip().startswith('###') and not line.strip().startswith('##'):
            return '\n'.join(lines[:i])
    return content

def clean_json_output(raw):
    match = re.search(r'```(?:json)?\s*({.*?})\s*```', raw, re.DOTALL)
    if match:
        return match.group(1).strip()
    return re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()


def get_db_connection():
    """Establishes and returns a new database connection."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Successfully connected to PostgreSQL database.")
        return conn
    except psycopg2.OperationalError as e:
        print(f"❌ Failed to connect to PostgreSQL. Please check your DB_CONFIG and ensure the server is running.")
        print(f"Error: {e}")
        return None

# ----------------------------------------
# DYNAMIC LLM EXTRACTION (Classify, Extract, Fallback)
# ----------------------------------------
async def classify_product(markdown_text: str) -> str:
    """LLM Call #1: Classifies the product"""
    prompt = f"""
    You are a strict and precise data classification engine. Your sole purpose is to classify the product in the text below into one of the predefined categories.

    Follow these rules exactly:
    1.  You MUST choose your answer from this exact list: {KNOWN_CATEGORIES}.
    2.  If the product does NOT CLEARLY AND DIRECTLY fit into any of the categories on the list, you MUST respond with the single word "Unknown", in English, as is.
    3.  Do NOT invent a new category or try to find the "closest" match if one does not exist.

    --- PRODUCT TEXT ---
    {markdown_text}
    --- END TEXT ---

 Your response must be a single word, containing the category of the product, in Bulgarian.
    """
    async with llm_semaphore:
        try:
            response = await asyncio.to_thread(
                ollama.chat,
                model="gemma3",
                messages=[{"role": "user", "content": prompt}],
                options={'temperature': 0}
            )
            category = response['message']['content'].strip()
            print(category)
            return category if category in SCHEMAS else "Unknown"
        except Exception as e:
            print(f"  [Error] Classification failed: {e}")
            return "Unknown"

async def extract_structured_data(markdown_text: str, schema: dict) -> str:
    """LLM Call #2: Extracts product data with real-time streaming to the console."""
    prompt = f"""
    You are a structured data extraction assistant.
    Your task is to extract accurate and complete information **ONLY about the primary product** described in the Markdown text below.
    
    **Instructions:**
    1.  **Adhere to the Schema:** The final JSON object MUST validate against the schema provided below.
    2.  **Fill all `required` fields:** All fields listed as `required` in the schema MUST be present in your output.
    3.  **Handle Missing Data:**  If a value is not found in the text, set that field to the string "null" (in quotes). Do not omit the key, and do not use the JSON null type — always use the string "null" instead.
    4.  **Respect Data Types:** Ensure all values match the `type` specified in the schema (e.g., `string`, `object`).
    5.  **Output Raw JSON:** Your entire response must be ONLY the raw JSON object, with no explanations or markdown formatting.
    6. Do not extract prices labeled as "ПЦД:". Extract ONLY the price associated with the product.

    --- MARKDOWN INPUT ---
    {markdown_text}
    --- END OF MARKDOWN INPUT ---

    Now, provide the JSON output, strictly following the provided schema.
    --- SCHEMA (use this structure) ---
    {json.dumps(schema, indent=2)}
    The JSON keys should be in English.
    """
    
    streamed_json = ""
    print("  [LLM Stream] ", end="", flush=True) 
    async with llm_semaphore:
        stream_generator = await asyncio.to_thread(
            ollama.chat,
            model="gemma3",
            messages=[
                {"role": "system", "content": "You only output raw, valid JSON."},
                {"role": "user", "content": prompt}
            ],
            stream=True,
            options={
                'num_ctx': 16384,
                'temperature': 0,
            },
        )

        for chunk in stream_generator:
            delta = chunk['message']['content']
            print(delta, end="", flush=True)
            streamed_json += delta      

    print()
    return clean_json_output(streamed_json)

def generate_and_save_schema(data: dict):
    """
    Analyzes an 'Unknown' product's data and saves a proposed JSON schema for it.
    """
    guessed_category = data.get("guessed_category", "new_product").strip()
    if not guessed_category:
        guessed_category = "unnamed_category"
        
    # Sanitize the category name to create a valid filename
    filename = re.sub(r'[^\w-]', '_', guessed_category) + ".json"
    filepath = os.path.join(PROPOSED_SCHEMA_DIR, filename)

    print(f"  [Schema Gen] Generating a new schema proposal for '{guessed_category}'...")

    attributes = data.get("attributes", {})
    if not attributes:
        print("  [Schema Gen] No attributes found to generate a schema.")
        return

    # Build the 'properties' part of the new schema
    new_properties = {
        "name": {"type": "string"},
        "brand": {"type": "string"},
        "price": {"type": "string"},
        "product_description": {
                "type": "string",
                "description": "A concise, human-readable summary of the product’s key features, specifications, and benefits, written in natural language. This should highlight what makes the product useful or unique, based only on the content provided in the markdown."
            },
        "specs": {
            "type": "object",
            "properties": {
                key: {"type": "string"} for key in attributes.keys()
            },
        }
    }

   # Full schema structure
    proposed_schema = {
            "type": "object",
            "properties": new_properties,
            "required": ["name", "brand", "price", "specs"]
    }
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(proposed_schema, f, indent=4, ensure_ascii=False)
    
    print(f"  [Schema Gen] ✅ Success! New schema saved to: {filepath}")

# Helper func to setup db table
def setup_database(connection):
    """Creates the products table if it doesn't already exist using raw SQL."""
    print("  [DB] Setting up database table...")
    create_table_query = """
    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        source_url VARCHAR(2048) NOT NULL UNIQUE,
        name VARCHAR(512) NOT NULL,
        brand VARCHAR(100),
        price DECIMAL(10, 2),
        category VARCHAR(50) NOT NULL,
        product_description TEXT,
        specs JSONB,
        last_scraped_at TIMESTAMPTZ DEFAULT NOW()
        
    );
    """
    with connection.cursor() as cursor:
        cursor.execute(create_table_query)
    connection.commit() # Save the changes
    print("  [DB] Table 'products' is ready.")

def save_to_postgresql(db_connection, data: dict):
    """
    Saves a new product's data to the PostgreSQL database.
    If the source_url already exists, it does nothing.
    """
    source_url = data.get("source_url")
    if not source_url:
        print("  [DB] ❌ Cannot save data: source_url is missing.")
        return

    print(f"  [DB] Attempting to save data for {source_url}...")
    name = data.get("name") or data.get("product_name")
    if not name:
        print(f"  [DB] ❌ Skipping save for {source_url}: 'name' is missing from data.")
        return
        
    brand = data.get("brand")
    category = data.get("detected_category")
    description = data.get("product_description")
    
    price_str = (data.get("price") or "0").replace("лв.", "").replace(" ", "").replace(".", "").replace(",", ".").strip()
    try:
        price_numeric = float(re.search(r'(\d+\.?\d*)', price_str).group(1))
    except (ValueError, TypeError, AttributeError):
        price_numeric = None

    specs_data = data.get("specs") or data.get("attributes")
    specs_json_string = json.dumps(specs_data) if specs_data else None

    sql = """
    INSERT INTO products (source_url, name, brand, price, category, product_description, specs)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (source_url) DO NOTHING;
    """
    values = (source_url, name, brand, price_numeric, category, description, specs_json_string)

    with db_connection.cursor() as cursor:
        cursor.execute(sql, values)
        # Check cursor.rowcount to see if a row was actually inserted (it will be 0 on conflict).
        if cursor.rowcount > 0:
            print(f"  [DB] ✅ Successfully saved new data for {source_url}.")
        else:
            print(f"  [DB] ⏩ Skipped. Data for {source_url} already exists in the database.")
  
    db_connection.commit()


async def process_single_result(result,db_connection):
    """Orchestrates the full crawling workflow for a given page."""
    url = result.url
    if not result.success:
        print(f"\n- Failed to crawl: {url} | Reason: {result.error_message}")
        return

    print(f"\n--- Processing: {url} ---")
    markdown = truncate_markdown(result.markdown.raw_markdown)
    category = await classify_product(markdown)
    print(f"  [Step 1] Detected Category: '{category}'")

    selected_schema = SCHEMAS[category]

    print(f"  [Step 2] Extracting data using '{category}' schema...")
    json_output = await extract_structured_data(markdown, selected_schema)

    print("  [Step 3] Validating...")
    try:
        parsed_data = json.loads(json_output)
        validate(instance=parsed_data, schema=selected_schema)
        
        parsed_data['source_url'] = url
        parsed_data['detected_category'] = category
        await asyncio.to_thread(save_to_postgresql, db_connection, parsed_data)
        if category == "Unknown":
            generate_and_save_schema(parsed_data)
        
        print(f" Success! Valid data for {url}.")
    except (json.JSONDecodeError, ValidationError) as e:
        print(f" FAILED for {url}: Validation error or bad JSON.")
        print(f"   Error: {e}")

async def process_crawled_results(results,db_connection):
    tasks = [process_single_result(result,db_connection) for result in results]
    await asyncio.gather(*tasks)

async def main():
    db_connection = None
    try:
        db_connection = get_db_connection()
        if not db_connection: 
            return
        setup_database(db_connection)
        print("✅ Database connection successful.")
        browser_config = BrowserConfig(
            headless=True,
            verbose=True,
            user_agent_mode="random",
            light_mode=True,
        )
        prune_filter = PruningContentFilter(threshold_type="dynamic")
        md_generator = DefaultMarkdownGenerator(content_filter=prune_filter)
        config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            markdown_generator=md_generator,
            verbose=True,
            table_score_threshold=8,
            exclude_external_links=True,
            exclude_internal_links=True,
            exclude_all_images=True,
            override_navigator=True,
            check_robots_txt=True,
            user_agent="Crawlitics/1.0"
        )

        dispatcher = MemoryAdaptiveDispatcher(
            memory_threshold_percent=98.0,
            check_interval=1.0, 
            max_session_permit=30,
            rate_limiter=RateLimiter(
                base_delay=(1.0, 3.0),
                max_delay=30.0,
                max_retries=3,
                rate_limit_codes=[429, 503]
            ),
        )
        start_time = time.perf_counter()
        urls_to_crawl = [
            "https://www.emag.bg/smartfon-apple-iphone-15-128gb-5g-black-mtp03rx-a/pd/DZ4H93YBM/"
            ]

        if not urls_to_crawl:
            print("No URLs to crawl. Exiting.")
            return

        print(f"Starting crawl for {len(urls_to_crawl)} URLs...")

        async with AsyncWebCrawler(config=browser_config) as crawler:
            container = await crawler.arun_many(urls=urls_to_crawl, config=config, dispatcher=dispatcher)
            results = []
            if isinstance(container, list):
                results = container
            else:
                async for res in container:
                    results.append(res)
            
            await process_crawled_results(results,db_connection)

        elapsed = time.perf_counter() - start_time
        print(f"\n✅ All crawling + dynamic extraction done in: {elapsed:.2f} seconds")

    except psycopg2.Error as err:
        print(f"FATAL: A database error occurred: {err}")
    except Exception as e:
        print(f"FATAL: An unexpected error occurred in main: {e}")
    finally:
        if db_connection:
            db_connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    asyncio.run(main())