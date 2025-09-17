import asyncio
import re
import time
from playwright.async_api import async_playwright, Page, ElementHandle, BrowserContext
from sentence_transformers import SentenceTransformer, util
from rapidfuzz import fuzz
from configs.site_configs import get_site_configs
from helpers.crawler_helpers import (
    click_matching_filter,
    extract_and_match_filter_values,
    filter_urls_by_query_relaxed,
    get_semantic_similarity, 
)

from configs.pydantic_models import SearchPayload, Filter
from typing import Callable, Coroutine
from configs.status_manager import TaskStatus, SubStatus
UpdateStatusCallable = Callable[[TaskStatus, SubStatus | None], Coroutine[None, None, None]]

COSINE_WEIGHT = 0.7
FUZZY_WEIGHT = 0.45
SEMANTIC_PRODUCT_TITLE_THRESHOLD = 0.55

print("Loading sentence-transformer model...", flush=True)
MODEL = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded.")

async def _click_and_track_option(
    page: Page, selectors: dict, option_text: str, applied_filters: set[str]
):
    """Helper to click a filter option, track it, and wait for the page update."""
    if option_text in applied_filters:
        return
        
    print(f"ACTION: Clicking filter option '{option_text}'")
    clicked = await click_matching_filter(page, selectors, option_text)
    if clicked:
        applied_filters.add(option_text)
        await page.wait_for_load_state('domcontentloaded', timeout=5000)
    else:
        print(f"ERROR: Failed to click filter option: '{option_text}'")

async def apply_price_filter(
    page: Page,
    selectors: dict,
    price_range_str: str,
    price_section: ElementHandle,
    applied_filters: set[str],
):
    """Handles applying a price filter, supporting custom inputs or predefined ranges."""
    try:
        min_price, max_price = map(int, price_range_str.split("-"))
    except (ValueError, IndexError):
        print(f"ERROR: Invalid price format '{price_range_str}'. Expected 'min-max'.")
        return

    #  Site supports custom min/max price input fields
    if selectors.get("support_custom_price_inputs"):
        inputs = await price_section.query_selector_all(selectors["custom_price_inputs_selector"])
        if len(inputs) == 2:
            print(f"ACTION: Filling custom price range: {min_price} - {max_price}")
            await inputs[0].fill(str(min_price))
            await inputs[1].fill(str(max_price))
            await inputs[1].press("Enter")
            return

    # Site has predefined price range checkboxes/links
    def price_range_matcher(match):
        lower = int(re.sub(r'[.\s]', '', match.group(1)))
        upper = int(re.sub(r'[.\s]', '', match.group(2)))
        return lower <= max_price and upper >= min_price

    price_regex = r"([\d.,]+)\s*-\s*([\d.,]+)"
    matched_options = await extract_and_match_filter_values(
        price_section, selectors["values"], price_regex, price_range_matcher
    )

    for option in matched_options:
        await _click_and_track_option(page, selectors, option, applied_filters)


async def apply_text_filter(page: Page, selectors: dict, user_values_str: str, filter_section: ElementHandle, applied_filters: set[str]):
    """Applies a text filter using semantic similarity."""
    target_values = [val.strip() for val in user_values_str.split(',')]
    
    # Get all available filter options from the website for batch processing
    option_elements = await filter_section.query_selector_all(selectors["values"])
    site_option_texts = [(await el.inner_text()).strip() for el in option_elements]
    
    if not site_option_texts:
        print("WARN: No text options found for this filter section.")
        return

    # For each user target value, find the best semantic match on the site
    for target_value in target_values:
        similarities = get_semantic_similarity(target_value, site_option_texts, MODEL)
        
        best_score = 0
        best_match_text = None
        for i, score in enumerate(similarities):
            if score > best_score:
                best_score = score
                best_match_text = site_option_texts[i]

        print(f"INFO: Matched value '{target_value}' -> '{best_match_text}' (Similarity: {best_score:.2f})")
        await _click_and_track_option(page, selectors, best_match_text, applied_filters)
    

async def apply_all_user_filters(page: Page, site_config: dict[str, any], user_filters_list: list[Filter]):
    """Applies filters by finding the best semantic match for each filter section."""
    selectors = site_config.get("side_filter_selectors")
    if not user_filters_list or not selectors:
        print("INFO: No user filters or missing selectors.")
        return

    applied_filter_names = set()
    applied_options = set()
    user_filters: dict[str, str] = {f.name: f.value for f in user_filters_list}
    max_passes = len(user_filters) + 1
    for _ in range(max_passes):
        remaining_filters = {k: v for k, v in user_filters.items() if k not in applied_filter_names}
        if not remaining_filters:
            print("SUCCESS: All filters applied.")
            break

        print(f"\n--- Filter Pass. Remaining: {list(remaining_filters.keys())} ---")
        sections = await page.query_selector_all(selectors["sections"])
        site_filter_titles = []
        section_map = {} # Map title back to its element
        for section in sections:
            title_el = await section.query_selector(selectors["titles"])
            if title_el:
                title = (await title_el.inner_text()).strip()
                if title:
                    site_filter_titles.append(title)
                    section_map[title] = section

        if not site_filter_titles:
            break

        #  Parallel Similarity Scoring 
        user_filter_names = list(remaining_filters.keys())
        user_embeddings = MODEL.encode(user_filter_names, convert_to_tensor=True)
        site_embeddings = MODEL.encode(site_filter_titles, convert_to_tensor=True)
        similarity_matrix = util.cos_sim(user_embeddings, site_embeddings)

        best_score = -1.0
        best_user_index = None
        best_site_index = None

        for i, user_filter in enumerate(user_filter_names):
            for j, site_title in enumerate(site_filter_titles):
                cosine_score = similarity_matrix[i][j].item()
                fuzzy_score = fuzz.partial_ratio(user_filter.lower(), site_title.lower()) / 100
                combined_filter_score = cosine_score * COSINE_WEIGHT + fuzzy_score * FUZZY_WEIGHT
                if combined_filter_score > best_score:
                    best_score = combined_filter_score
                    best_user_index = i
                    best_site_index = j

        if best_user_index is None or best_site_index is None:
            print(" WARN: No match found for any filter this round.")
            break
        
        best_user_filter = user_filter_names[best_user_index]
        best_site_title = site_filter_titles[best_site_index]
        filter_value = remaining_filters[best_user_filter]
        matched_section_element = section_map[best_site_title]

        print(f" Best Match: '{best_user_filter}' → '{best_site_title}' (Score: {best_score:.2f})")

        if "price" in best_user_filter.lower() or "цена" in best_user_filter.lower():
            await apply_price_filter(page, selectors, filter_value, matched_section_element, applied_options)
        else:
            await apply_text_filter(page, selectors, filter_value, matched_section_element, applied_options)

        applied_filter_names.add(best_user_filter)
        await page.wait_for_selector(selectors["sections"], state="visible", timeout=7000)

    if len(applied_filter_names) < len(user_filters):
        print(" Not all filters applied. Remaining:")
        for f in user_filters:
            if f not in applied_filter_names:
                print(f"  - {f}: {user_filters[f]}")



async def navigate_to_product_category(page: Page, site_config: dict[str, any]) -> str:
    """
    Performs an initial search and navigates to the main category page via breadcrumbs.
    Returns the URL of the category page.
    """
    print(f"\n Searching on {site_config['site_name']}: {site_config['search_url']}")
    await page.goto(site_config['search_url'])
    await page.wait_for_selector(site_config['search_product_card_selector'], timeout=8000)
    if(site_config["site_name"] == "Ozone.bg"): await page.wait_for_timeout(1000)
    first_product = await page.query_selector(site_config['search_product_card_selector'])
    if not first_product:
        print(" No product found on initial search page.")
        return None

    href = await first_product.get_attribute("href")
    if not href:
        print(" Product element is missing href attribute.")
        return None
        
    product_url = href if href.startswith("http") else site_config['base_url'] + href
    
    print(f"INFO: Navigating to first product to find breadcrumbs: {product_url}")
    await page.goto(product_url)
    
    breadcrumb_links = await page.query_selector_all(f"{site_config['breadcrumb_selector']} a")
    if not breadcrumb_links:
        print(" No breadcrumb links found. Staying on search results page.")
        await page.goto(site_config['search_url'])
        return page.url

    last_link = breadcrumb_links[-1]
    category_link = await last_link.get_attribute("href")
    
    if not category_link:
        print("Breadcrumb link has no href. Staying on search results page.")
        await page.goto(site_config['search_url'])
        return page.url
        
    category_url = category_link if category_link.startswith("http") else site_config['base_url'] + category_link
    print(f"SUCCESS: Found category page via breadcrumb: {category_url}")
    await page.goto(category_url)
    return category_url


async def crawl_paginated_results(page: Page, site_config: dict[str, any], user_query: str, max_pages: int) -> set[str]:
    """Crawls product URLs from the category page, handling pagination."""
    product_urls = set()
    
    for page_num in range(1, max_pages + 1):
        print(f"\n--- Scraping Page {page_num} on {site_config['site_name']} ---")
        try:
            await page.wait_for_selector(site_config['category_product_card_selector'], timeout=8000)
        except Exception:
            print(f"INFO: No products found on page {page_num}, or selector is invalid. Stopping.")
            break

        product_elements = await page.query_selector_all(site_config['category_product_card_selector'])
        if not product_elements:
            print(f"INFO: No more products found on page {page_num}.")
            break
            
        page_matches = 0
        product_titles = [(await el.inner_text())[:100].strip() for el in product_elements]
        
        similarities = get_semantic_similarity(user_query, product_titles, MODEL)
        for i, element in enumerate(product_elements):
            score = similarities[i]
            title = product_titles[i]
            if score >= SEMANTIC_PRODUCT_TITLE_THRESHOLD:
                href = await element.get_attribute("href")
                if href:
                    full_url = href if href.startswith("http") else site_config['base_url'] + href
                    product_urls.add(full_url)
                    page_matches += 1
                    print(f"   Matched '{title[:100]}...' (Similarity: {score:.2f})")

        print(f"INFO: Page {page_num}: Found {page_matches} matching products from {len(product_elements)} total.")

        next_button_selector = site_config.get("pagination_next_button_selector")
        if not next_button_selector:
            print("INFO: No pagination selector configured. Scraping complete.")
            break

        next_button = await page.query_selector(next_button_selector)
        if next_button:
            next_button_css_disabled_class = await next_button.evaluate("el => /(disable|disabled)/.test(el.className)")
            if not next_button_css_disabled_class:
                print("ACTION: Clicking next page...")
                await next_button.scroll_into_view_if_needed()
                await next_button.click()
                await page.wait_for_timeout(100)
            else:
                print(f"INFO: Pagination ended on page {page_num}.")
                break
        else:
            print(f"INFO: Pagination ended on page 1!")
            break
    return product_urls


async def run_site_crawl(context: BrowserContext, site_config: dict[str, any], user_criteria: SearchPayload) -> list[str]:
    """Orchestrates the entire crawling process for a single site."""
    page = await context.new_page()
    site_name = site_config['site_name']
    print(f"\n{'='*20} Starting crawling for: {site_name.upper()} {'='*20}")
    
    try:
        category_url = await navigate_to_product_category(page, site_config)
        if not category_url:
            print(f"ERROR: Could not navigate to category page for {site_name}. Aborting.")
            return []

        await apply_all_user_filters(page, site_config, user_criteria.filters)
        
        return await crawl_paginated_results(
            page, site_config, user_criteria.product_name, max_pages=3
        )
    except Exception as e:
        print(f"FATAL ERROR during crawling of {site_name}: {e}")
        return []
    finally:
        await page.close()

async def crawl_sites(user_criteria: SearchPayload, update_status: UpdateStatusCallable) -> tuple[str, list[str]]:
    await update_status(TaskStatus.CRAWLING, SubStatus.INITIALIZING)

    user_selected_category: str = user_criteria.product_category
    user_input: str = user_criteria.product_name

    # convert list[Filter] into dict[name -> value]
    user_filters: dict[str, str] = {f.name: f.value for f in user_criteria.filters}
    print(f"--- Starting crawling for '{user_input}' ---")
    if user_filters:
        print("With filters:")
        for name, value in user_filters.items():
            print(f"  - {name}: {value}")
    
    site_configs = get_site_configs(user_input, user_filters)

    await update_status(TaskStatus.CRAWLING, SubStatus.STARTING_SITES, count=len(site_configs))

    start_time = time.perf_counter()

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => undefined })")

        tasks = [run_site_crawl(context, site, user_criteria) for site in site_configs]
        results_per_site = await asyncio.gather(*tasks)
        
        await browser.close()

    all_urls = [url for site_urls in results_per_site for url in site_urls]
    
    print(f"\n\n{'='*20} CRAWL COMPLETE {'='*20}")
    print(f"Found {len(all_urls)} total URLs before final filtering.")

    await update_status(TaskStatus.CRAWLING, SubStatus.COLLECTING_URLS)

    filtered_urls = filter_urls_by_query_relaxed(all_urls, user_input)

    await update_status(TaskStatus.CRAWLING, SubStatus.FILTERING_URLS, count=len(filtered_urls))
    
    print(f"Found {len(filtered_urls)} relevant product URLs.")


    for i, url in enumerate(filtered_urls, 1):
        print(f"{i:2d}. {url}")
        
    elapsed = time.perf_counter() - start_time
    print(f"\n Crawling done in {elapsed:.2f} seconds")
    return user_selected_category, filtered_urls
