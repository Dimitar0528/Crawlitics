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
from sqlalchemy.orm import Session

from dotenv import load_dotenv
load_dotenv()

from product_schemas import SCHEMAS
from scraper_helpers import (
    SessionLocal,
    generate_and_save_product_schema,
    setup_database,
    save_record_to_db,
    read_record_from_db,
)
from crawler import crawl_urls
LLM_CONCURRENCY = 2
llm_semaphore = asyncio.Semaphore(LLM_CONCURRENCY)

KNOWN_CATEGORIES = [cat for cat in SCHEMAS if cat != "Unknown"]

def truncate_markdown(content: str) -> str:
    """Truncate uncessesary markdown content."""
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.strip().startswith('###') and not line.strip().startswith('##'):
            return '\n'.join(lines[:i])
    return content

def clean_output(raw_content:str) -> str:
    """Cleans up Markdown code block fences."""
    match = re.search(r'```(?:json)?\s*({.*?})\s*```', raw_content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return re.sub(r"^```(?:json)?|```$", "", raw_content.strip(), flags=re.MULTILINE).strip()

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
    6. **Do not under any circumstance extract prices labeled as "ПЦД:" **. Extract ONLY the price associated with the product.
    --- MARKDOWN INPUT ---
    {markdown_text}
    --- END OF MARKDOWN INPUT ---

    Now, provide the JSON output, strictly following the provided schema.
    --- SCHEMA (use this structure) ---
    {json.dumps(schema, indent=2)}
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

async def process_single_result(result: CrawlResult, session: Session, user_selected_category: str):
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
        parsed_data['product_category'] = user_selected_category

        if user_selected_category == "Unknown":
            generate_and_save_product_schema(parsed_data)
            parsed_data['product_category'] = parsed_data["guessed_category"]
            
        await asyncio.to_thread(save_record_to_db, session, parsed_data)
        
        
        print(f" Success! Valid data for {url}.")
    except (json.JSONDecodeError, ValidationError) as e:
        print(f" FAILED for {url}: Validation error or bad JSON.")
        print(f"   Error: {e}")

async def process_crawled_results(results: list[CrawlResult], user_selected_category: str):
    with SessionLocal() as session:
        tasks = [process_single_result(result, session, user_selected_category) for result in results]
        await asyncio.gather(*tasks)

async def main():
    start_time = time.perf_counter()
    try:
        setup_database()
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
        
        found_products, urls_to_crawl = read_record_from_db(urls_to_process)
        if found_products:
            print("\n--- Summary of Valid Products Found in Database ---")
            for url, data in found_products.items():
                print(f"{data},")

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
                
                await process_crawled_results(results, user_selected_category)

        elapsed = time.perf_counter() - start_time
        print(f"\n All crawling + scraping + dynamic extraction done in: {elapsed:.2f} seconds")

        # The user chooses whether to run the data analyst agent or not
        run_analysis_choice = input("Would you like to run a comparative analysis on the collected products? (y/n): ").lower().strip()
        if run_analysis_choice == 'y':
            try:
                from data_analyst_agent.product_ranking_analyst_agent import analyze_and_rank_products
                
                await analyze_and_rank_products(found_products)
                
            except ImportError:
                print("\n[Error] Could not import the analyst agent. Make sure 'product_data_analyst_agent.py' exists.")
            except Exception as analysis_err:
                print(f"\n[Error] An error occurred during analysis: {analysis_err}")
        else:
            print("Skipping analysis. Exiting.")
    except psycopg2.Error as err:
        print(f"FATAL: A database error occurred: {err}")

if __name__ == "__main__":
    asyncio.run(main())