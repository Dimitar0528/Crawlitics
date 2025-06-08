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

from crawler import crawl_urls
# ----------------------------------------
# CONFIG
# ----------------------------------------
LLM_CONCURRENCY = 2
llm_semaphore = asyncio.Semaphore(LLM_CONCURRENCY)

PRODUCT_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "brand": {"type": "string"},
        "model": {"type": "string"},
        "specs": {
            "type": "object",
            "properties": {
                "screen_size": {"type": "string"},
                "processor": {"type": "string"},
                "ram": {"type": "string"},
                "storage": {"type": "string"},
                "graphics": {"type": "string"}
            },
            "required": ["screen_size", "processor", "ram", "storage", "graphics"]
        },
        "price": {"type": "string"},
    },
    "required": ["name", "brand", "model", "specs", "price"]
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
    return re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()

# ----------------------------------------
# LLM Extraction Phase
# ----------------------------------------
async def extract_info_with_gemma_json(markdown_text):
    schema_example = {
        "name": "string",
        "brand": "string",
        "model": "string",
        "specs": {
            "screen_size": "string",
            "processor": "string",
            "ram": "string",
            "storage": "string",
            "graphics": "string"
        },
        "price": "string",
    }

    prompt = f"""
You are a structured data extraction assistant.

Your task is to extract accurate and complete information **ONLY about the primary product** described in the Markdown text below.

Here is the Markdown input:
--- START OF MARKDOWN INPUT ---
{markdown_text}
-- END OF MARKDOWN INPUT ---

Extract the product data from the Markdown above and output it as raw JSON only.
No markdown formatting, no explanations.
Do not extract prices labeled as "ПЦД:".

Use this format (all keys required):
{json.dumps(schema_example, indent=2)}

"""

    async with llm_semaphore:
        stream = ollama.chat(
            model="gemma3",
            messages=[
                {"role": "system", "content": "You only output clean, structured JSON with no markdown formatting."},
                {"role": "user", "content": prompt}
            ],
            stream=True,
            options={
                'num_ctx': 16384,
                'temperature':0,
            },
        )

        streamed_json = ""
        for chunk in stream:
            delta = chunk['message']['content']
            print(delta, end="", flush=True)
            streamed_json += delta

    return clean_json_output(streamed_json)

# ----------------------------------------
# Extract from crawled markdowns
# ----------------------------------------
async def extract_from_results(results):
    for result in results:
        url = result.url
        if not result.success:
            print(f"\n Failed to crawl: {url} \n Reason: {result.error_message}")
            continue

        print(f"\n✅ Extracting: {url}")
        markdown = truncate_markdown(result.markdown.raw_markdown)
        print('RAW-MARKDOWN-START-----------------')
        print(markdown)
        print("RAW-MARKDOWN-END------------------")
        try:
            json_output = await extract_info_with_gemma_json(markdown)
            parsed = json.loads(json_output)
            validate(instance=parsed, schema=PRODUCT_SCHEMA)
            print(f"\n✅ Valid JSON for {url}")
        except (json.JSONDecodeError, ValidationError) as e:
            print(f"\n❌ Invalid JSON for {url}:\n{e}\nRaw Output:\n{json_output}")

# ----------------------------------------
# MAIN
# ----------------------------------------
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
    urls = await crawl_urls()

    async with AsyncWebCrawler(config=browser_config) as crawler:
        container = await crawler.arun_many(urls=urls, config=config, dispatcher=dispatcher)

        results = []
        if isinstance(container, list):
            results = container
        else:
            async for res in container:
                results.append(res)

        await extract_from_results(results)

    elapsed = time.perf_counter() - start_time
    print(f"\n✅ All crawling + scraping + extraction done in: {elapsed:.2f} seconds")

if __name__ == "__main__":
    asyncio.run(main())