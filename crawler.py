import asyncio
from rapidfuzz import fuzz
from playwright.async_api import async_playwright
import re
import time
from site_configs import get_site_configs 

FUZZY_MATCH_THRESHOLD = 76

async def manipulate_side_filter(page, side_filter_selectors, user_filters):
    side_filter_sections = await page.query_selector_all(side_filter_selectors["sections"])
    website_filters = {}

    min_price = user_filters["price"].get("min_price")
    max_price = user_filters["price"].get("max_price")

    if min_price is not None and max_price is not None:
        price_ranges = []

        for section in side_filter_sections:
            title_element = await section.query_selector(side_filter_selectors["titles"])
            if not title_element:
                continue

            title_text = await title_element.inner_text()
            normalized_title_text = title_text.replace("\u00a0", " ").strip()

            if side_filter_selectors.get("support_custom_price_inputs"):
                custom_price_inputs = await section.query_selector_all(side_filter_selectors["custom_price_inputs_selector"])
                if custom_price_inputs:
                    await custom_price_inputs[0].fill(str(min_price))
                    await page.wait_for_timeout(50)
                    await custom_price_inputs[1].fill(str(max_price))
                    await custom_price_inputs[1].press("Enter")
            elif normalized_title_text == "Цена":
                price_elements = await section.query_selector_all(side_filter_selectors["values"])
                for element in price_elements:
                    range_text = await element.inner_text()
                    normalized_range_text = range_text.replace("\u00a0", " ").strip()
                    cleaned_text = re.sub(r"\s*\(\d+\)$", "", normalized_range_text)
                    match = re.search(r"(?:лв\.)?([\d.]+)\s*-\s*(?:лв\.)?([\d.]+)", cleaned_text)

                    if match:
                        lower = int(match.group(1).replace(".", ""))
                        upper = int(match.group(2).replace(".", ""))
                        if lower <= int(max_price) and upper >= int(min_price):
                            print(f"✅ Matched website filter range: {cleaned_text}")
                            price_ranges.append(cleaned_text)

        if price_ranges:
            website_filters["Цена"] = price_ranges

    return website_filters


async def click_matching_filter(page, side_filter_selectors, filter):
    try:
        elements = page.locator(side_filter_selectors["values"])
        count = await elements.count()
        for i in range(count):
            text = await elements.nth(i).inner_text()
            normalized = text.replace("\u00a0", " ").strip()
            if filter in normalized:
                await elements.nth(i).click()
                return True
    except Exception as e:
        print(f" Failed to click price filter: {e}")
    return False


async def apply_user_filters(page, side_filter_selectors, user_filters):
    if not user_filters:
        return

    website_filters = await manipulate_side_filter(page, side_filter_selectors, user_filters)

    for key, values in website_filters.items():
        for filter in values:
            print(f" Clicking filter: {key} = {filter}")
            await page.wait_for_selector(side_filter_selectors["values"])
            clicked = await click_matching_filter(page, side_filter_selectors, filter)
            if clicked:
                await page.wait_for_timeout(50)
            else:
                print(f"❌ Could not find and click filter: {filter}")
    await page.wait_for_timeout(1000)


async def extract_product_category_link_from_breadcrumb(
    page,
    site_name,
    base_url,
    search_url,
    search_product_card_selector,
    breadcrumb_selector,
):
    print(f"\n🔍 Searching on {site_name}: {search_url}")
    await page.goto(search_url)
    await page.wait_for_selector(search_product_card_selector, timeout=8000)

    element = await page.query_selector(search_product_card_selector)

    if not element:
        print("❌ No product element found.")
        return

    href = await element.get_attribute("href")
    if not href:
        print("❌ Product element missing  href.")
        return

    if not href.startswith("http"):
        href = base_url + href
    print(f" Opening first product:")
    await page.goto(href)
    product_category_link = None

    breadcrumb_links = await page.query_selector_all(f"{breadcrumb_selector} a")
    if breadcrumb_links:
        last_link = breadcrumb_links[-1]
        product_category_link = await last_link.get_attribute("href")
        if not product_category_link.startswith("http"):
            product_category_link = base_url + product_category_link
        print(f"\n Searching on {site_name}: {product_category_link}")
        await page.goto(product_category_link)
    else:
        print("⚠️ No <a> links found in breadcrumb to click.")
    return product_category_link


async def search_and_get_all_results(
    page,
    site_name,
    base_url,
    search_url,
    breadcrumb_selector,
    search_product_card_selector,
    category_product_card_selector,
    side_filter_selectors=None,
    pagination_next_button_selector=None,
    user_input=None,
    user_filters=None,
    max_pages=3
):
    await extract_product_category_link_from_breadcrumb(
        page,
        site_name,
        base_url,
        search_url,
        search_product_card_selector,
        breadcrumb_selector,
    )

    if user_filters:
        await apply_user_filters(page, side_filter_selectors, user_filters)

    product_urls = []
    seen_titles = set()

    for page_num in range(1, max_pages + 1):
        try:
            await page.wait_for_selector(category_product_card_selector, timeout=8000)
            product_elements = await page.query_selector_all(category_product_card_selector)

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
                        print(f" Matched ({similarity}%)")

            print(f" Page {page_num}: Scraped {len(product_elements)} products on {site_name}.")

            if not pagination_next_button_selector:
                break

            next_button = await page.query_selector(pagination_next_button_selector)
            if next_button:
                print(f" Clicking next page on {site_name}...")
                await next_button.scroll_into_view_if_needed()
                await next_button.click()
                await page.wait_for_timeout(200)
                await page.wait_for_selector(category_product_card_selector, timeout=8000)
            else:
                print(f" Pagination ended on page {page_num} for {site_name}.")
                break
        except Exception as e:
            print(f" Error on page {page_num} of {site_name}: {e}")
            break

    return product_urls


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
    min_price = input("Min price? (Optional): ") or None
    max_price = input("Max price? (Optional): ") or None

    user_filters = {
        "price": {
            "min_price": min_price,
            "max_price": max_price
        }
    }

    site_configs = get_site_configs(user_input, user_filters)
    start_time = time.perf_counter()

    # launch browser and use anit-bot detection mecahnism
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
        headless=False,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--no-sandbox",
    ]
)
        browser_context = await browser.new_context(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        locale="en-US",
        timezone_id="Europe/Sofia",
        viewport={"width": 1280, "height": 800},
)
       # Hide webdriver
        await browser_context.add_init_script("""() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
        }""")

        pages = [await browser_context.new_page() for _ in site_configs]

        tasks = [
            search_and_get_all_results(
                page,
                site["site_name"],
                site["base_url"],
                site["search_url"],
                site["breadcrumb_selector"],
                site["search_product_card_selector"],
                site["category_product_card_selector"],
                site["side_filter_selectors"],
                site["pagination_next_button_selector"],
                site["user_input"],
                site["user_filters"],
                max_pages=3
            )
            for page, site in zip(pages, site_configs)
        ]

        results = await asyncio.gather(*tasks)
        await browser_context.close()
        await browser.close()

        all_urls = [url for sublist in results for (url, _) in sublist]
        print(f"\n All Found Product URLs ({len(all_urls)} total)")

        filtered_urls = filter_urls_by_query_relaxed(all_urls, user_input)
        print(f"\n All Filtered Product URLs ({len(filtered_urls)} total)")

        for i, url in enumerate(filtered_urls, 1):
            print(f"{i:2d}. {url}")

    elapsed = time.perf_counter() - start_time
    print(f"\n✅ Done in {elapsed:.2f} seconds")


if __name__ == "__main__":
    asyncio.run(main())
