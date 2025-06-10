import asyncio
import re
import time
from typing import Dict, Any, List, Optional, Set

from rapidfuzz import fuzz
from playwright.async_api import async_playwright, Page, ElementHandle, BrowserContext

from site_configs import get_site_configs
from helpers import (
    click_matching_filter,
    extract_and_match_filter_values,
    filter_urls_by_query_relaxed,
)

FUZZY_PRODUCT_TITLE_MATCH_THRESHOLD = 55
FUZZY_SECTION_TITLE_MATCH_THRESHOLD = 80

async def _click_and_track_option(
    page: Page, selectors: Dict, option_text: str, applied_filters: Set[str]
):
    """Helper to click a filter option, track it, and wait for the page update."""
    if option_text in applied_filters:
        return # Avoid double-clicking
        
    print(f"ACTION: Clicking filter option '{option_text}'")
    clicked = await click_matching_filter(page, selectors, option_text)
    if clicked:
        applied_filters.add(option_text)
        # Give time for the page to update after a filter is applied
        await page.wait_for_load_state('domcontentloaded', timeout=5000)
    else:
        print(f"ERROR: Failed to click filter option: '{option_text}'")

async def apply_price_filter(
    page: Page,
    selectors: Dict,
    price_range_str: str,
    price_section: ElementHandle,
    applied_filters: Set[str],
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
        if len(inputs) >= 2:
            print(f"ACTION: Filling custom price range: {min_price} - {max_price}")
            await inputs[0].fill(str(min_price))
            await page.wait_for_timeout(50)
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


async def apply_text_filter(
    page: Page,
    selectors: Dict,
    user_values_str: str,
    filter_section: ElementHandle,
    applied_filters: Set[str],
):
    """Handles simple text matching for filters like storage, color, etc."""
    target_values = {val.strip().lower() for val in user_values_str.split(',')}
    
    def text_matcher(option_text: str) -> bool:
        return any(
            fuzz.token_set_ratio(target.lower(), option_text.lower()) > 90
            for target in target_values
        )

    matched_options = await extract_and_match_filter_values(
        filter_section, selectors["values"], match_logic=text_matcher
    )

    for option in matched_options:
        await _click_and_track_option(page, selectors, option, applied_filters)


async def apply_all_user_filters(page: Page, site_config: Dict[str, Any], user_filters: Dict[str, str]):
    """
    Applies user filters using a non-mutating worklist strategy.
    """
    selectors = site_config.get("side_filter_selectors")
    if not user_filters or not selectors:
        print("INFO: No user filters or missing selectors.")
        return

    applied_filters = set()
    applied_options = set()
    max_passes = len(user_filters) + 1

    for _ in range(max_passes):
        remaining_filters = {
            name: value for name, value in user_filters.items()
            if name not in applied_filters
        }

        if not remaining_filters:
            print("SUCCESS: All filters applied.")
            break

        print(f"\n--- Filter Pass. Remaining: {list(remaining_filters.keys())} ---")
        sections = await page.query_selector_all(selectors["sections"])
        if not sections:
            print("ERROR: No filter sections found.")
            break

        for section in sections:
            title_el = await section.query_selector(selectors["titles"])
            title = (await title_el.inner_text()).strip() if title_el else ""
            if not title:
                continue

            for filter_name, filter_value in remaining_filters.items():
                score = fuzz.token_set_ratio(filter_name.lower(), title.lower())
                if score < FUZZY_SECTION_TITLE_MATCH_THRESHOLD:
                    continue

                print(f"INFO: Matched '{filter_name}' → '{title}' ({score}%)")

                if any(x in filter_name.lower() for x in ("цена", "price")):
                    await apply_price_filter(page, selectors, filter_value, section, applied_options)
                else:
                    await apply_text_filter(page, selectors, filter_value, section, applied_options)

                applied_filters.add(filter_name)
                break  # Break from filters loop and refresh DOM
            else:
                continue
            break  # Break from sections loop and refresh DOM

async def navigate_to_product_category(page: Page, site_config: Dict[str, Any]) -> Optional[str]:
    """
    Performs an initial search and navigates to the main category page via breadcrumbs.
    Returns the URL of the category page.
    """
    print(f"\n🔍 Searching on {site_config['site_name']}: {site_config['search_url']}")
    await page.goto(site_config['search_url'])
    await page.wait_for_selector(site_config['search_product_card_selector'], timeout=8000)

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
        await page.goto(site_config['search_url']) # Go back to search results
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


async def scrape_paginated_results(page: Page, site_config: Dict[str, Any], user_query: str, max_pages: int) -> Set[str]:
    """Scrapes product URLs from the category page, handling pagination."""
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
        for element in product_elements:
            href = await element.get_attribute("href")
            title = await element.inner_text()
            if not href or not title:
                continue
            print(title[:50])
            full_url = href if href.startswith("http") else site_config['base_url'] + href
            similarity = fuzz.partial_ratio(user_query.lower(), title[:50].lower())
            
            if similarity >= FUZZY_PRODUCT_TITLE_MATCH_THRESHOLD:
                product_urls.add(full_url)
                page_matches += 1
                print(f" Matched '{title[:50]}...' (Similarity: {similarity}%)")

        print(f"INFO: Page {page_num}: Found {page_matches} matching products from {len(product_elements)} total.")

        next_button_selector = site_config.get("pagination_next_button_selector")
        if not next_button_selector:
            print("INFO: No pagination selector configured. Scraping complete.")
            break

        next_button = await page.query_selector(next_button_selector)
        if next_button and await next_button.is_enabled():
            print("ACTION: Clicking next page...")
            await next_button.scroll_into_view_if_needed()
            await next_button.click()
        else:
            print(f"INFO: Pagination ended on page {page_num}.")
            break
            
    return product_urls

def get_user_criteria() -> Dict[str, Any]:
    """
    Prompts the user for a search query and multiple filters, then
    constructs and returns the criteria dictionary.
    """
    print("--- Product Search & Filter Setup ---")
    
    # Get the main search query
    while not (query := input(" What product are you looking for? (e.g., iPhone 15 Pro) \n   ").strip()):
        print("    Search query cannot be empty. Please try again.")
    print(f"    Searching for: {query}\n")

    # Get filters in a loop
    filters = {}
    print(" Now, let's add some filters. (Press Enter on an empty filter name to finish / exit)")
    
    while True:
        # Prompt for the filter name (e.g., Цена, Цвят, Вътрешна памет)
        filter_name = input("   - Filter Name (e.g., Цена, Color): ").strip()
        
        # If the user just hits Enter, they're done adding filters
        if not filter_name:
            if not filters:
                print("    No filters were added.\n")
            else:
                print("    Finished adding filters.\n")
            break

        # Prompt for the filter value(s)
        print(f"     Enter value(s) for '{filter_name}'.")
        print("     - For price/range, use 'min-max' (e.g., 1500-2500).")
        print("     - For single / multiple text value(s), separate with a comma (e.g., 128 GB, 256 GB).")
        filter_value = input("     Value(s): ").strip()

        if filter_value:
            filters[filter_name] = filter_value
            print(f"    Added Filter: {filter_name} = {filter_value}\n")
        else:
            print(f"    Filter '{filter_name}' was not added because the value was empty.\n")
            
    # 3. Construct the final dictionary
    criteria = {
        "query": query,
        "filters": filters
    }
    
    return criteria

async def run_site_scrape(context: BrowserContext, site_config: Dict[str, Any], user_criteria: Dict) -> List[str]:
    """Orchestrates the entire scraping process for a single site."""
    page = await context.new_page()
    site_name = site_config['site_name']
    print(f"\n{'='*20} Starting Scrape for: {site_name.upper()} {'='*20}")
    
    try:
        # Navigate to the correct category page
        category_url = await navigate_to_product_category(page, site_config)
        if not category_url:
            print(f"ERROR: Could not navigate to category page for {site_name}. Aborting.")
            return []

        # Apply all user-defined filters
        await apply_all_user_filters(page, site_config, user_criteria['filters'])
        
        # Scrape results from all pages
        return await scrape_paginated_results(
            page, site_config, user_criteria['query'], max_pages=3
        )
    except Exception as e:
        print(f"FATAL ERROR during scrape of {site_name}: {e}")
        return []
    finally:
        await page.close()


async def main():
    user_criteria = get_user_criteria()

    user_input = user_criteria['query']
    user_filters = user_criteria['filters']

    print(f"--- Starting Scrape for '{user_input}' ---")
    if user_filters:
        print("With filters:")
        for name, value in user_filters.items():
            print(f"  - {name}: {value}")
    
    site_configs = get_site_configs(user_input, user_filters)
    start_time = time.perf_counter()

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
        )
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => undefined })")

        tasks = [run_site_scrape(context, site, user_criteria) for site in site_configs]
        results_per_site = await asyncio.gather(*tasks)
        
        await browser.close()

    all_urls = [url for site_urls in results_per_site for url in site_urls]
    
    print(f"\n\n{'='*20} SCRAPE COMPLETE {'='*20}")
    print(f"Found {len(all_urls)} total URLs before final filtering.")
    
    filtered_urls = filter_urls_by_query_relaxed(all_urls, user_input)
    print(f"Found {len(filtered_urls)} relevant product URLs.")

    for i, url in enumerate(filtered_urls, 1):
        print(f"{i:2d}. {url}")
        
    elapsed = time.perf_counter() - start_time
    print(f"\n Done in {elapsed:.2f} seconds")
    return filtered_urls


if __name__ == "__main__":
    asyncio.run(main())