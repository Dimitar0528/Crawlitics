import asyncio
import json
import time

from agno.agent import Agent, RunResponseEvent
from agno.models.ollama import Ollama
from typing import AsyncIterator

from jsonschema import validate, ValidationError
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig, CacheMode
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.async_dispatcher import MemoryAdaptiveDispatcher, RateLimiter,CrawlResult

import psycopg2
from sqlalchemy.orm import Session

from dotenv import load_dotenv
load_dotenv()

from product_schemas import SCHEMAS
from helpers.scraper_helpers import (
    SessionLocal,
    generate_and_save_product_schema,
    initialize_database_on_first_run,
    save_record_to_db,
    read_record_from_db,
    update_record_from_db,
    extract_dynamic_data_from_markdown
)
from helpers.helpers import clean_output
from crawler import crawl_urls
from db_models import Product

AGENT_CONCURRENCY = 4
agent_semaphore = asyncio.Semaphore(AGENT_CONCURRENCY)

KNOWN_CATEGORIES = [cat for cat in SCHEMAS if cat != "Unknown"]

def truncate_markdown(content: str) -> str:
    """Truncate uncessesary markdown content."""
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.strip().startswith('###') and not line.strip().startswith('##'):
            return '\n'.join(lines[:i])
    return content

# ----------------------------------------
# DYNAMIC LLM EXTRACTION
# ----------------------------------------

async def extract_structured_data(markdown_text: str, schema: dict) -> str:
    """LLM Agent Call: Extracts product data with real-time streaming to the console."""
    start_time = time.perf_counter()

    product_extraction_agent = Agent(
       model=Ollama(id="gemma3:latest",
        options={
        'num_ctx': 16000,
        'temperature': 0,
        }),
        description="You are a structured data extraction assistant specialized in extracting product information.",
        instructions=[
            f"""
            Your task is to extract accurate and complete information **ONLY about the primary product** described in the Markdown text below.
    
    **Instructions:**
    1.  **Adhere to the Schema:** The final JSON object MUST validate against the schema provided below.
    2.  **Fill all `required` fields:** All fields listed as `required` in the schema MUST be present in your output.
    3.  **Handle Missing Data:**  If a value is not found in the text, set that field to the STRING "null" (in DOUBLE QUOTES). Do not omit the key, and DO Not use the JSON null type — ALWAYS use the string "null" instead.
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
        ],
    )
    response: AsyncIterator[RunResponseEvent] = await product_extraction_agent.arun(
        f"Extract product information from the markdown text:", stream=True
    )
    streamed_data_text:str = ""
    async for event in response:
            if event.event == "RunResponseContent":
                print(event.content, end="", flush=True)
                streamed_data_text += event.content      

    elapsed = time.perf_counter() - start_time
    print(f"\n Dynamic extraction done in: {elapsed:.2f} seconds")
    return clean_output(streamed_data_text)

async def process_single_crawled_result(result: CrawlResult, session: Session, user_selected_category: str):
    """Orchestrates the full scraping workflow for a given page."""
    url = result.url
    if not result.success:
        print(f"\n- Failed to crawl: {url} | Reason: {result.error_message}")
        return

    print(f"\n--- Processing: {url} ---")
    markdown = truncate_markdown(result.markdown.raw_markdown)
    existing_product = session.query(Product).filter(Product.source_url == url).first()
    if existing_product:
         print(f"  Product exists. Checking for fresh new data...")
         new_price, new_availability = extract_dynamic_data_from_markdown(markdown)
         await asyncio.to_thread(
            update_record_from_db, 
            session, 
            url, 
            new_price, 
            new_availability
        )
    else:
        selected_schema = SCHEMAS[user_selected_category]

        json_output = await extract_structured_data(markdown, selected_schema)
        _, availability = extract_dynamic_data_from_markdown(markdown, exlude_price=True)
        print("Validating extracted data...")
        try:
            parsed_data = json.loads(json_output)
            validate(instance=parsed_data, schema=selected_schema)
            
            parsed_data['source_url'] = url
            parsed_data['category'] = user_selected_category
            parsed_data['availability'] = availability
            parsed_data["image_url"] = result.metadata.get('og:image')
            
            if user_selected_category == "Unknown":
                generate_and_save_product_schema(parsed_data)
                parsed_data['category'] = parsed_data["guessed_category"]

            await asyncio.to_thread(save_record_to_db, session, parsed_data)
            print(f" Success! Valid data for {url}.")
        except (json.JSONDecodeError, ValidationError) as e:
            print(f" FAILED for {url}: Validation error or bad JSON.")
            print(f"   Error: {e}")

async def main():
    start_time = time.perf_counter()
    try:
        initialize_database_on_first_run()
        browser_config = BrowserConfig(
            headless=True,
            verbose=True,
            user_agent_mode="random",
            light_mode=True,
            text_mode=True,
            extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
        )
        config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            markdown_generator=DefaultMarkdownGenerator(),
            verbose=True,
            table_score_threshold=8,
            exclude_external_links=True,
            exclude_internal_links=True,
            exclude_all_images=True,
            excluded_tags=["header", "aside", "nav", "footer"],
            locale="bg-BG",
            override_navigator=True,
            check_robots_txt=True,
            user_agent="Crawlitics/1.0",
            stream=True,
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
        if urls_to_crawl:
            print(f"Starting crawl for {len(urls_to_crawl)} URLs...")

            async with AsyncWebCrawler(config=browser_config) as crawler:
                async def semaphore_task(result: CrawlResult):
                    async with agent_semaphore:
                        with SessionLocal() as session:
                            await process_single_crawled_result(result, session, user_selected_category)

                tasks = []
                async for result in await crawler.arun_many(urls=urls_to_crawl, config=config, dispatcher=dispatcher):
                    result: CrawlResult 
                    print(f"Just completed: {result.url}")
                    tasks.append(asyncio.create_task(semaphore_task(result)))
                await asyncio.gather(*tasks)

        elapsed = time.perf_counter() - start_time
        print(f"\n All crawling + scraping + dynamic extraction done in: {elapsed:.2f} seconds")

        # The user chooses whether to run the data analyst agent or not
        run_product_analysis_choice = input("Would you like to run a comparative analysis on the collected product data using several predefined evaluation criteria? (y/n): ").lower().strip()
        if run_product_analysis_choice == 'y':
            try:
                from data_analyst_agent.product_ranking_analyst_agent import analyze_and_rank_products
                
                analyze_and_rank_products(found_products)
                
            except ImportError:
                print("\n[Error] Could not import the analyst agent. Make sure it exists.")
            except Exception as analysis_err:
                print(f"\n[Error] An error occurred during analysis: {analysis_err}")
        else:
            print("Skipping analysis. Exiting.")

        run_visual_insight_choise = input("Would you like to run a visual product analysis on the collected data and generate various useful charts? (y/n): ").lower().strip()
        if run_visual_insight_choise == 'y':
            try:
                from data_analyst_agent.visual_insight_agent import run_visualize_product_analysis_insights
                run_visualize_product_analysis_insights(found_products)
            except ImportError:
                print("\n[Error] Could not import the analyst agent. Make sure it exists.")
            except Exception as analysis_err:
                print(f"\n[Error] An error occurred during analysis: {analysis_err}")
        else:
            print("Skipping analysis. Exiting.")
    except psycopg2.Error as err:
        print(f"FATAL: A database error occurred: {err}")

if __name__ == "__main__":
    asyncio.run(main())