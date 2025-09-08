import asyncio
import json
import time
from typing import TypedDict
from ollama import Client

from jsonschema import validate, ValidationError
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig, CacheMode
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.async_dispatcher import MemoryAdaptiveDispatcher, RateLimiter, CrawlResult

from sqlalchemy.orm import Session

from collections import defaultdict

from dotenv import load_dotenv
load_dotenv()

from helpers.scraper_helpers import (
    extract_dynamic_data_from_markdown
)
from helpers.helpers import clean_output
from db.helpers import SessionLocal
from db.crud import (
    get_product_variant_by_url,
    update_product_variant,
    read_products_from_db,
    create_product_category_schema,
    get_schema_by_product_category
)
from db.models import ProductCategorySchema
from data_aggregation import analyze_and_store_group, get_grouping_key
from crawler import crawl_sites
from configs.pydantic_models import SearchPayload

AGENT_CONCURRENCY = 4
agent_semaphore = asyncio.Semaphore(AGENT_CONCURRENCY)

# base schema to guide the LLM to generate a more specific one.
BASE_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "price": {"type": "number"},
        "brand": {"type": "string"},
        "currency": {
            "type": "string",
            "description": "The currency in which the product price is listed, such as 'BGN' or 'EUR' for Euro. Always use the standard three-letter currency code."
        },
        "category": {
            "type": "string",
            "description": "A product category that MUST BE written in Bulgarian (e.g., 'Компютри', 'Смартфони', 'Телевизори'). The value must be a ONE OR MAX TWO noun(s), the first one plural, describing what the product fundamentally is, not its purpose, usage, or features. Start with a capital letter. Do not return adjectives like 'Гейминг', 'Бизнес', 'Смарт'"
        },
        "description": {
            "type": "string",
            "description": "A concise, human-readable summary of the product's key features and benefits, written in a natural language paragraph. Highlight what makes the product useful or unique based ONLY on the provided text. The description should be in Bulgarian."
        },
        "specs": {
            "type": "object",
            "description": "A flat key-value map of all product specifications. Keys MUST be written in English and snake_case.",
        }
    },
    "required": ["name", "price", "brand", "currency", "category", "description", "specs"]
}

client = Client()

def truncate_markdown(content: str) -> str:
    """Truncate unnecessary markdown content."""
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.strip().startswith('###') and not line.strip().startswith('##'):
            return '\n'.join(lines[:i])
    return content

# ----------------------------------------
# DYNAMIC LLM EXTRACTION
# ----------------------------------------
class GenerateSchemaAndExtractDataResult(TypedDict):
    schema: ProductCategorySchema
    data: dict[str,any]

async def generate_schema_and_extract_data(session: Session, markdown_text: str, category: str) -> GenerateSchemaAndExtractDataResult:
    """
    "Thinking Mode" LLM Call. Generates a schema, extracts data based on that schema,
    saves the schema to the DB, and returns both the schema object and the data.
    """
    print("  Entering 'Thinking Mode' to generate and store a new universal schema...")
    system_prompt = (
        "You are an expert data architect. Your task is to first create a specific JSON schema based on the product in the markdown, "
        "and then immediately extract the data into that schema. Respond with a single JSON object containing two top-level keys: "
        "'generated_schema' and 'extracted_data'."
    )
    user_prompt = f"""
    **Step 1: Analyze the Product.**
    Read the provided markdown text to understand the product's attributes.

    **Step 2: Generate a Specific Schema.**
    Act as an expert product analyst building a schema for a comparison website. Your goal is to **discern the signal from the noise**. From the base schema, evolve the `specs` object to only include properties a **savvy shopper would care about**. Prioritize specs that define the product's performance, capability, and primary, important features. Filter out the "datasheet fluff"—unimportant specs like physical dimensions weight, unnecessary features etc. unless it is an very important defining feature of the product. Also include color and features.

    --- BASE SCHEMA TEMPLATE ---
    {json.dumps(BASE_SCHEMA, indent=2, ensure_ascii=False)}
    Populate the specs object field within the base schema with the found specs in.

    DO NOT USE THE BASE SCHEMA AS THE FINAL OUTPUT FOR generated_schema, BUT RATHER TO ENHANCE THE BASE SCHEMA BASED ON THE PRODUCT INFO RECEIVED.

    **Step 3: Extract Data.**
    Immediately use the schema you just designed in Step 2 to extract the product information from the markdown.
    The product description MUST be 4-5 sentences MAX.
    In the product name include ONLY the core brand and name of the product.
    
    **Step 4: Format the Output.**
    Return a single, raw JSON object with two keys: `generated_schema` (containing the schema from Step 2) and `extracted_data` (containing the data from Step 3).
    
    --- MARKDOWN INPUT ---
    {markdown_text}
    --- END OF MARKDOWN INPUT ---
    """
    messages = [{'role': 'system', 'content': system_prompt}, {'role': 'user', 'content': user_prompt}]
    
    schema_json_text = ""
    async with agent_semaphore:
        try:
            response_stream = client.chat(
                model="qwen3:4b", 
                messages=messages, 
                stream=True, 
                think=True,  
                options={'num_ctx': 10000, 'temperature': 0}
            )
            for chunk in response_stream:
                if chunk.message.thinking:
                    print(chunk.message.thinking, end='', flush=True)
                if chunk.message.content:
                    print(chunk.message.content, end='', flush=True)
                    schema_json_text += chunk.message.content
        except Exception as e:
            print(f"\nAn error occurred during schema generation: {e}")
            raise

    print("\n  Generation and extraction complete. Processing response...")
    response_data = json.loads(clean_output(schema_json_text))
    
    generated_schema_dict: dict[str, any] = response_data.get('generated_schema', {})
    extracted_data: dict[str, any] = response_data.get('extracted_data', {})

    if not generated_schema_dict or not extracted_data:
        raise ValueError("LLM response was missing 'generated_schema' or 'extracted_data'.")

    new_db_schema = create_product_category_schema(session, category, generated_schema_dict)
    
    return {"schema": new_db_schema, "data": extracted_data}

async def extract_data_with_schema(markdown_text: str, schema: dict[str, any]) -> dict[str, any]:
    """
    "Extraction-Only Mode" LLM Call. Extracts data from markdown using a provided schema.
    """
    print("  Entering 'Extraction Mode' to extract structured data...")
    system_prompt = (
        "You are a precise data extraction assistant. You MUST respond with only a raw JSON object "
        "that strictly validates against the user-provided schema. No explanations."
    )
    user_prompt = f"""
    Extract complete information for the product in the markdown text below, strictly following the provided JSON schema.
    If a value is not found, you MUST use the string "null". Do not extract prices labeled "ПЦД:".
    The product description MUST be 4-5 sentences MAX.
    In the product name include ONLY the core brand and name of the product. Strictly set the product category based on information about the product.
    --- SCHEMA ---
    {json.dumps(schema, indent=2, ensure_ascii=False)}
    --- END OF SCHEMA ---

    --- MARKDOWN INPUT ---
    {markdown_text}
    --- END OF MARKDOWN INPUT ---
    """
    messages = [{'role': 'system', 'content': system_prompt}, {'role': 'user', 'content': user_prompt}]

    data_json_text = ""
    async with agent_semaphore:
        try:
            response_stream = client.chat(
                model="qwen3:4b", 
                messages=messages, 
                format="json", 
                stream=True, 
                options={'num_ctx': 10000, 'temperature': 0}
            )
            for chunk in response_stream:
                if chunk.message.content:
                    print(chunk.message.content, end='', flush=True)
                    data_json_text += chunk.message.content
        except Exception as e:
            print(f"\nAn error occurred during data extraction: {e}")
            return {}
            
    return json.loads(clean_output(data_json_text))

async def process_single_crawled_and_scraped_result(result: CrawlResult, session: Session, schema_to_use: dict[str, any], is_called_from_schema_gen_mode_func = False, schema_gen_mode_parsed_data: dict[str, any] = None):
    """Orchestrates the full scraping workflow for a given page."""
    url = result.url
    if not result.success:
        print(f"\n- Failed to crawl: {url} | Reason: {result.error_message}")
        return None

    print(f"\n--- Processing: {url} ---")
    markdown = truncate_markdown(result.markdown.raw_markdown)
    
    existing_product_variant = await asyncio.to_thread(get_product_variant_by_url, session, url)
    if existing_product_variant:
        print(f"  Product variant exists. Checking for fresh new data. LLM data extraction skipped.")
        new_price, new_availability = extract_dynamic_data_from_markdown(markdown)
        await asyncio.to_thread(
            update_product_variant, 
            session, 
            existing_product_variant, 
            new_price, 
            new_availability
        )
    else: 
        _, availability = extract_dynamic_data_from_markdown(markdown, exlude_price=True)
        parsed_data = None
        try:
            if is_called_from_schema_gen_mode_func:
                parsed_data = schema_gen_mode_parsed_data
            else:    
                parsed_data = await extract_data_with_schema(markdown, schema_to_use)

            print("Validating extracted data...")
            validate(instance=parsed_data, schema=schema_to_use)
            
            parsed_data['source_url'] = url
            parsed_data['availability'] = availability
            parsed_data["image_url"] = result.metadata.get('og:image')

            print(f" Success! Valid data for {url}.")
            return parsed_data
        except (json.JSONDecodeError, ValidationError) as e:
            print(f" FAILED for {url}: Validation error or bad JSON.")
            print(f"   Error: {e}")
            return None

async def scrape_sites(user_criteria: SearchPayload):
    start_time = time.perf_counter()
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
        user_agent="CrawleeBot/1.0",
        stream=True,
    )

    dispatcher = MemoryAdaptiveDispatcher(
        memory_threshold_percent=98,
        critical_threshold_percent=98,
        check_interval=1.0, 
        max_session_permit=30,
        rate_limiter=RateLimiter(
            base_delay=(1.25, 3.25),
            max_delay=30.0,
            max_retries=3,
            rate_limit_codes=[429, 503]
        ),
    ) 
    
    user_selected_category, urls_to_process = await crawl_sites(user_criteria)
    
    if not urls_to_process:
        print("No URLs to crawl. Exiting.")
        return
    
    found_products, urls_to_scrape = read_products_from_db(urls_to_process)
    
    if urls_to_scrape:
        print(f"Starting scraping for {len(urls_to_scrape)} URLs...")
        all_scraped_data: list[dict[str, any]] = []
        with SessionLocal() as db_check_session:
            print(f"Checking database for existing schema for category: '{user_selected_category}'...")
            db_schema = get_schema_by_product_category(db_check_session, user_selected_category)

        if db_schema:
            print(" Schema found in database. Entering high-speed 'Extraction-Only' mode for all URLs.")
            universal_schema_dict = db_schema
            urls_for_concurrent_extraction = urls_to_scrape
        else:
            print(" No schema found. Entering 'Schema Generation' mode using the first URL.")
            first_url = urls_to_scrape[0]
            urls_for_concurrent_extraction = urls_to_scrape[1:]

            async with AsyncWebCrawler(config=browser_config) as crawler:
                print(f"--- Processing seed URL for schema: {first_url} ---")
                first_result = await crawler.arun(url=first_url, config=config)
                if not first_result.success:
                    raise Exception(f"Failed to crawl seed URL: {first_result.error_message}")
                
                with SessionLocal() as generation_session:    
                    #  generate the schema, save it, and extract the product data based on it
                    initial_run_result = await generate_schema_and_extract_data(
                        generation_session, truncate_markdown(first_result.markdown.raw_markdown), user_selected_category
                    )
                    # process the data from this first run
                    universal_schema_dict = initial_run_result["schema"].schema_definition
                    first_url_data_raw = initial_run_result["data"]

                    first_url_data = await process_single_crawled_and_scraped_result(
                        first_result, 
                        generation_session, 
                        universal_schema_dict, 
                        is_called_from_schema_gen_mode_func=True, 
                        schema_gen_mode_parsed_data=first_url_data_raw
                        )
                    
                all_scraped_data.append(first_url_data)

        if not universal_schema_dict:
            print("\nFATAL: Failed to obtain a schema. Aborting.")
            return
        
        if not urls_for_concurrent_extraction:
            print("\nNo further URLs to process.")
        else:
            print(f"\n--- Starting CONCURRENT processing for remaining {len(urls_for_concurrent_extraction)} URLs ---")
            async with AsyncWebCrawler(config=browser_config) as crawler:
                async def scrape_site_task():
                    with SessionLocal() as session:
                        return await process_single_crawled_and_scraped_result(result, session, universal_schema_dict)

                tasks = []
                async for result in await crawler.arun_many(urls=urls_for_concurrent_extraction, config=config, dispatcher=dispatcher):
                    result: CrawlResult
                    print(f"Scrape completed for: {result.url}")
                    tasks.append(asyncio.create_task(scrape_site_task()))

                remaining_scraped_data = [res for res in await asyncio.gather(*tasks) if res is not None]
                all_scraped_data.extend(remaining_scraped_data)
        
        elapsed = time.perf_counter() - start_time
        print(f"\n All crawling + scraping + dynamic extraction done in: {elapsed:.2f} seconds")
        
        # if all_scraped_data:
        #     print("\n--- Starting PASS 2: Aggregating and Storing Data ---")
            
        #     product_groups = defaultdict(list)
        #     for item in all_scraped_data:
        #         key = get_grouping_key(item, list(product_groups.keys()))
        #         product_groups[key].append(item)

        #     print(f"Found {len(product_groups)} unique product groups.")
        #     for key in product_groups.keys():
        #         print(f"  - Group: {key}")

        #     db_session = SessionLocal()
        #     for key, items in product_groups.items():
        #         analyze_and_store_group(db_session, key, items)
        #     db_session.close()
        #     print("\n" + "="*50 + "\nDATABASE OPERATION COMPLETE\n" + "="*50)

    # The user chooses whether to run the data analyst agent or not
    # run_product_analysis_choice = input("Would you like to run a comparative analysis on the collected product data using several predefined evaluation criteria? (y/n): ").lower().strip()
    # if run_product_analysis_choice == 'y':
    #     try:
    #         from data_analyst_agent.product_ranking_analyst_agent import analyze_and_rank_products
            
    #         analyze_and_rank_products(found_products)
            
    #     except ImportError:
    #         print("\n[Error] Could not import the analyst agent. Make sure it exists.")
    #     except Exception as analysis_err:
    #         print(f"\n[Error] An error occurred during analysis: {analysis_err}")
    # else:
    #     print("Skipping analysis. Exiting.")

    # run_visual_insight_choice = input("Would you like to run a visual product analysis on the collected data and generate various useful charts? (y/n): ").lower().strip()
    # if run_visual_insight_choice == 'y':
    #     try:
    #         from data_analyst_agent.visual_insight_agent import run_visualize_product_analysis_insights
    #         run_visualize_product_analysis_insights(found_products)
    #     except ImportError:
    #         print("\n[Error] Could not import the analyst agent. Make sure it exists.")
    #     except Exception as analysis_err:
    #         print(f"\n[Error] An error occurred during analysis: {analysis_err}")
    # else:
    #     print("Skipping analysis. Exiting.")