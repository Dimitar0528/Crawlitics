import asyncio
from urllib.parse import quote_plus
from rapidfuzz import fuzz
from playwright.async_api import async_playwright
import re
import time

FUZZY_MATCH_THRESHOLD = 76

import re

async def manipulate_side_filter(
    page, 
    price, 
    side_filter_sections_selector, 
    size_filter_sections_title_selector,
    side_filter_values_selector
):
    side_filter_sections = await page.query_selector_all(side_filter_sections_selector)
    for side_filter_section in side_filter_sections:
        # Extract the title of the side filter section
        title_element = await side_filter_section.query_selector(size_filter_sections_title_selector)
        if not title_element:
            continue
        # Get and normalize the title text
        title_text = await title_element.inner_text()
        normalized_title_text = title_text.replace("\u00a0", " ").strip()

        # Based on the title, apply different filtering logic
        if normalized_title_text == "Цена":
            price_elements = await side_filter_section.query_selector_all(side_filter_values_selector)
            for price_element in price_elements:
                range_text = await price_element.inner_text()
                normalized_range_text = range_text.replace("\u00a0", " ").strip()
                
                # Remove trailing (xxx) numbers
                cleaned_text = re.sub(r"\s*\(\d+\)$", "", normalized_range_text)
                # Skip irrelevant or non-numeric price ranges
                if not re.search(r"(?:лв\.)?\d+\s*-\s*(?:лв\.)?\d+", cleaned_text):
                    print(f"  Skipped non-numeric price range: {cleaned_text}")
                    continue  # skip to the next loop iteration

                print(f"  Price Range: {cleaned_text}")

                # Extract the numeric range using regex
                match = re.search(r"(?:лв\.)?([\d.]+)\s*-\s*(?:лв\.)?([\d.]+)", cleaned_text)
                if match:
                    lower = int(match.group(1).replace(".", ""))
                    upper = int(match.group(2).replace(".", ""))
                    if lower <= int(price) <= upper:
                        print(f" Price {price} is in range: {cleaned_text}")
                        return cleaned_text 
                else:
                    print(f" Couldn't parse price range: {cleaned_text}")
    return None



# Abstracted helper to click on matching elements
async def click_matching_range_filter(
    page, 
    target_label,
    side_filter_values_selector
):
    try:
        elements = page.locator(side_filter_values_selector)
        count = await elements.count()
        for i in range(count):
            text = await elements.nth(i).inner_text()
            normalized = text.replace("\u00a0", " ").strip()
            if target_label in normalized:
                await elements.nth(i).click()
                return True
    except Exception as e:
        print(f"⚠️ Failed to click price filter: {e}")
    return False

# Applies user-defined filters to manipulate the search page
async def apply_filters(
    page, 
    filters, 
    side_filter_values_selector, 
    side_filter_sections_selector, 
    size_filter_sections_title_selector
):
    if not filters:
        return

    print(" Applying filters...")

    if "price" in filters:
        label = await manipulate_side_filter(page, filters["price"], side_filter_sections_selector, size_filter_sections_title_selector,side_filter_values_selector)
        if label:
            print(f"🪙 Clicking price range filter: {label}")
            await page.wait_for_selector(side_filter_values_selector)
            clicked = await click_matching_range_filter(page, label, side_filter_values_selector)
            if clicked:
                await page.wait_for_timeout(200)
            else:
                print(" Could not find matching price label.")

# Handles product search and pagination
async def search_and_get_all_results(
        page, 
        site_name, 
        search_url, 
        product_card_selector, 
        base_url, 
        user_input, 
        next_button_selector=None, 
        filters=None, 
        side_filter_values_selector=None, 
        side_filter_sections_selector=None,
        size_filter_sections_title_selector=None,
        max_pages=2
    ):
    print(f"\n🔍 Searching on {site_name}: {search_url}")
    await page.goto(search_url)
    await page.wait_for_timeout(200)

    if filters:
        await apply_filters(page, filters, side_filter_values_selector, side_filter_sections_selector,size_filter_sections_title_selector)

    product_urls = []
    seen_titles = set()

    for page_num in range(1, max_pages + 1):
        try:
            await page.wait_for_selector(product_card_selector, timeout=8000)
            product_elements = await page.query_selector_all(product_card_selector)

            for element in product_elements:
                href = await element.get_attribute("href")
                title = await element.inner_text()

                if href and title and title not in seen_titles:
                    seen_titles.add(title)
                    if not href.startswith("http"):
                        href = base_url + href

                    similarity = fuzz.partial_ratio(user_input.lower(), title.lower())
                    if similarity >= FUZZY_MATCH_THRESHOLD:
                        product_urls.append((href, title))
                        print(f" Matched ({similarity}%): {title}")

            print(f" Page {page_num}: Scraped {len(product_elements)} products on {site_name}.")

            if not next_button_selector:
                break

            next_button = await page.query_selector(next_button_selector)
            if next_button:
                print(f"➡️ Clicking next page on {site_name}...")
                await next_button.scroll_into_view_if_needed()
                await next_button.click()
                await page.wait_for_timeout(200)
                await page.wait_for_selector(product_card_selector, timeout=8000)
            else:
                print(f" Pagination ended on page {page_num} for {site_name}.")
                break
        except Exception as e:
            print(f" Error on page {page_num} of {site_name}: {e}")
            break

    return product_urls

# Token-based relaxed filter for final URL list
def filter_urls_by_query_relaxed(urls, query):
    query_tokens = query.lower().split()
    min_tokens = len(query_tokens)
    filtered_urls = []
    for url in urls:
        url_path = url.lower()
        matched_tokens = sum(token in url_path for token in query_tokens)
        if matched_tokens >= min_tokens:
            filtered_urls.append(url)
    return filtered_urls

async def main():
    user_input = "Samsung Galaxy S25"
    query = quote_plus(user_input)

    filters = {
        "price": input(" Max price? (Optional): ") or None,
    }
    filters = {k: v for k, v in filters.items() if v}

    site_configs = [
        {
            "site_name": "Ozone.bg",
            "search_url": f"https://www.ozone.bg/instantsearchplus/result/?q={query}",
            "product_card_selector": "a.isp_product_image_href",
            "base_url": "https://www.ozone.bg",
            "user_input": user_input,
            "next_button_selector": ".page-item.next .page-link",
            "filters": filters,
            "side_filter_values_selector": ".isp_facet_value_name",
            "side_filter_sections_selector": ".isp_single_facet_wrapper",
            "size_filter_sections_title_selector": ".isp_facet_title span.isp_facet_title_name"
        },

    ]
    start_time = time.perf_counter()
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=False)
        pages = [await browser.new_page() for _ in site_configs]

        tasks = [
            search_and_get_all_results(
                page,
                site["site_name"],
                site["search_url"],
                site["product_card_selector"],
                site["base_url"],
                site["user_input"],
                site["next_button_selector"],
                site.get("filters"),
                site["side_filter_values_selector"],
                site["side_filter_sections_selector"],
                site["size_filter_sections_title_selector"],
                max_pages=2,
            )
            for page, site in zip(pages, site_configs)
        ]

        results = await asyncio.gather(*tasks)
        await browser.close()

        all_urls = [url for sublist in results for (url, _) in sublist]

        print(f"\n All Found Product URLs ({len(all_urls)} total):")

        filtered_urls = filter_urls_by_query_relaxed(all_urls, user_input)

        print(f"\n All Filtered Product URLs ({len(filtered_urls)} total):")
        for i, url in enumerate(filtered_urls, 1):
            print(f"{i:2d}. {url}")
        elapsed = time.perf_counter() - start_time
        print(f"\n All crawling done in {elapsed:.2f} seconds")
if __name__ == "__main__":
    asyncio.run(main())
