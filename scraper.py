import asyncio
import json
import re
import time
import ollama
from jsonschema import validate, ValidationError
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig, CacheMode
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.async_dispatcher import MemoryAdaptiveDispatcher, RateLimiter,CrawlResult
import psycopg2
from psycopg2.extensions import connection

from dotenv import load_dotenv
load_dotenv()

from product_schemas import SCHEMAS
from scraper_helpers import (
    truncate_markdown, 
    clean_output,
    generate_and_save_product_schema,
    get_db_connection,
    setup_database,
    map_db_row_to_schema_format
)
from crawler import crawl_urls
LLM_CONCURRENCY = 2
llm_semaphore = asyncio.Semaphore(LLM_CONCURRENCY)

KNOWN_CATEGORIES = [cat for cat in SCHEMAS if cat != "Unknown"]

# ----------------------------------------
# DYNAMIC LLM EXTRACTION
# ----------------------------------------

async def extract_structured_data(markdown_text: str, schema: dict) -> str:
    """LLM Call: Extracts product data with real-time streaming to the console."""
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
    
    streamed_data_text:str = ""
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
            streamed_data_text += delta      

    print()
    return clean_output(streamed_data_text)


def save_to_postgresql(db_connection: connection, data: dict[str,str]):
    """
    Saves a new product's data to the PostgreSQL database, if it doesn't already exist."""
    source_url = data.get("source_url")
    if not source_url:
        print("  [DB] Cannot save data: source_url is missing.")
        return

    print(f"  [DB] Attempting to save data for {source_url}...")
    name = data.get("name") or data.get("product_name")
    if not name:
        print(f"  [DB] Skipping save for {source_url}: 'name' is missing from data.")
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
            print(f"  [DB] Successfully saved new data for {source_url}.")
        else:
            print(f"  [DB] Skipped. Data for {source_url} already exists in the database.")
  
    db_connection.commit()

async def read_products_from_db(db_connection: connection, urls: list[str]) -> tuple[dict[str, any], list]:
    """
    Reads a list of URLs from the database, converts them to schema format,
    validates them, and logs the results.

    Returns:
        A tuple containing:
        - A dictionary of {url: data} for successfully found and validated products.
        - A list of URLs that were not found in the database.
    """
    if not urls:
        return {}, []

    print(f"\n[DB Read] Checking for {len(urls)} URLs in the database...")
    
    found_products = {}
    
    # Use '%s' as a placeholder to sanitaize data
    placeholders = ', '.join(['%s'] * len(urls))
    query = f"""
        SELECT source_url, name, brand, price, category, product_description, specs 
        FROM products 
        WHERE source_url IN ({placeholders})
    """

    with db_connection.cursor() as cursor:
        cursor.execute(query, tuple(urls))
        
        # Get column names dynamically to create dictionaries
        columns = [desc[0] for desc in cursor.description]
        
        for row in cursor.fetchall():
            row_dict = dict(zip(columns, row))
            source_url: str = row_dict.get("source_url")
            rehydrated_json = map_db_row_to_schema_format(row_dict)
            
            if not rehydrated_json:
                print(f"  [DB Read] Could not process row for {source_url}.")
                continue

            category: str = rehydrated_json.get("detected_category")
            
            print(f"  [DB Read] Found '{source_url}'. Validating against '{category}' schema...")
            try:
                schema_to_validate = SCHEMAS.get(category)
                if schema_to_validate:
                    validate(instance=rehydrated_json, schema=schema_to_validate)
                    print(f"  [DB Read] SUCCESS: Cached data for {source_url} is valid.")
                    found_products[source_url] = rehydrated_json
                else:
                    print(f"  [DB Read] WARNING: No schema found for category '{category}'. Cannot validate.")

            except ValidationError as e:
                print(f"  [DB Read] FAILED: Cached data for {source_url} is now invalid against the current schema.")
                print(f"     Reason: {e.message}")

    urls_not_found = [url for url in urls if url not in found_products]

    return found_products, urls_not_found


async def process_single_result(result: CrawlResult, db_connection: connection, user_selected_category: str):
    """Orchestrates the full scraping workflow for a given page."""
    url = result.url
    if not result.success:
        print(f"\n- Failed to crawl: {url} | Reason: {result.error_message}")
        return

    print(f"\n--- Processing: {url} ---")
    markdown = truncate_markdown(result.markdown.raw_markdown)
    selected_schema = SCHEMAS[user_selected_category]

    print(f"  [Step 1] Extracting data using '{user_selected_category}' schema...")
    json_output = await extract_structured_data(markdown, selected_schema)

    print("  [Step 2] Validating...")
    try:
        parsed_data = json.loads(json_output)
        validate(instance=parsed_data, schema=selected_schema)
        
        parsed_data['source_url'] = url
        parsed_data['detected_category'] = user_selected_category
        
        await asyncio.to_thread(save_to_postgresql, db_connection, parsed_data)
        
        if user_selected_category == "Unknown":
            generate_and_save_product_schema(parsed_data)
        
        print(f" Success! Valid data for {url}.")
    except (json.JSONDecodeError, ValidationError) as e:
        print(f" FAILED for {url}: Validation error or bad JSON.")
        print(f"   Error: {e}")

async def process_crawled_results(results: list[CrawlResult], db_connection: connection, user_selected_category: str):
    tasks = [process_single_result(result, db_connection, user_selected_category) for result in results]
    await asyncio.gather(*tasks)

async def main():
    db_connection = None
    start_time = time.perf_counter()
    try:
        db_connection = get_db_connection()
        if not db_connection: 
            return
        setup_database(db_connection)
        print("Database connection successful.")
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
            locale="bg-BG",
            override_navigator=True,
            check_robots_txt=True,
            user_agent="Crawlitics/1.0"
        )

        dispatcher = MemoryAdaptiveDispatcher(
            memory_threshold_percent=98.0,
            check_interval=1.0, 
            max_session_permit=30,
            rate_limiter=RateLimiter(
                base_delay=(1.25, 3.25),
                max_delay=30.0,
                max_retries=3,
                rate_limit_codes=[429, 503]
            ),
        )
        user_selected_category, urls_to_process = await crawl_urls()
        if not urls_to_process:
            print("No URLs to crawl. Exiting.")
            return
        
        found_products, urls_to_crawl = await read_products_from_db(db_connection, urls_to_process)
        if found_products:
            print("\n--- Summary of Valid Products Found in Database ---")
            for url, data in found_products.items():
                print(f"URL: {url}; \n DATA:{data}")

        if urls_to_crawl:
            print(f"Starting crawl for {len(urls_to_crawl)} URLs...")

            async with AsyncWebCrawler(config=browser_config) as crawler:
                container = await crawler.arun_many(urls=urls_to_crawl, config=config, dispatcher=dispatcher)
                results = []
                if isinstance(container, list):
                    results = container
                else:
                    async for res in container:
                        results.append(res)
                
                await process_crawled_results(results, db_connection, user_selected_category)

        elapsed = time.perf_counter() - start_time
        print(f"\n All crawling + dynamic extraction done in: {elapsed:.2f} seconds")

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