import asyncio
import json
import re
import time
import ollama
from jsonschema import validate, ValidationError
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig, CacheMode
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.async_dispatcher import MemoryAdaptiveDispatcher, RateLimiter

from product_schemas import SCHEMAS
LLM_CONCURRENCY = 2
llm_semaphore = asyncio.Semaphore(LLM_CONCURRENCY)

KNOWN_CATEGORIES = [cat for cat in SCHEMAS if cat != "Unknown"]

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


# ----------------------------------------
# DYNAMIC LLM EXTRACTION (Classify, Extract, Fallback)
# ----------------------------------------
async def classify_product(markdown_text: str) -> str:
    """LLM Call #1: Classifies the product"""
    prompt = f"""
    You are a strict and precise data classification engine. Your sole purpose is to classify the product in the text below into one of the predefined categories.

    Follow these rules exactly:
    1.  You MUST choose your answer from this exact list: {KNOWN_CATEGORIES}.
    2.  If the product does NOT CLEARLY AND DIRECTLY fit into any of the categories on the list, you MUST respond with the single word "Unknown".
    3.  Do NOT invent a new category or try to find the "closest" match if one does not exist.

    --- PRODUCT TEXT ---
    {markdown_text}
    --- END TEXT ---

 Your response must be a single word, containing the category of the product.
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

async def process_single_result(result):
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

    print("  [Step 3] Validating and saving...")
    try:
        parsed_data = json.loads(json_output)
        validate(instance=parsed_data, schema=selected_schema)
        
        parsed_data['source_url'] = url
        parsed_data['detected_category'] = category
        # save_result_to_jsonl(parsed_data)
        
        print(f" Success! Valid data for {url}.")
    except (json.JSONDecodeError, ValidationError) as e:
        print(f" FAILED for {url}: Validation error or bad JSON.")
        print(f"   Error: {e}")

async def process_crawled_results(results):
    tasks = [process_single_result(result) for result in results]
    await asyncio.gather(*tasks)

async def main():
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
        "https://www.ozone.bg/product/smartfon-apple-iphone-15-pro-6-1-256gb-natural-titanium/"
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
        
        await process_crawled_results(results)

    elapsed = time.perf_counter() - start_time
    print(f"\n✅ All crawling + dynamic extraction done in: {elapsed:.2f} seconds")

if __name__ == "__main__":
    asyncio.run(main())