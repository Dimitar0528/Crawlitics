import asyncio
from playwright.async_api import async_playwright
from urllib.parse import quote_plus
from rapidfuzz import fuzz

FUZZY_MATCH_THRESHOLD = 0

async def search_and_get_all_results(page, site_name, search_url, result_selector, base_url,user_input):
    await page.goto(search_url)
    print(f"\n🔍 Searching on {site_name}: {search_url}")

    product_urls = []

    try:
        await page.wait_for_selector(result_selector, timeout=8000)
        product_elements = await page.query_selector_all(result_selector)
    
        for element in product_elements:
            href = await element.get_attribute('href')
            title = await element.inner_text()

            if href and title:
                if not href.startswith("http"):
                    href = base_url + href
                title_norm = title.lower().strip()
                user_input_norm = user_input.lower().strip()

                similarity = fuzz.partial_ratio(user_input_norm, title_norm)
                if similarity >= FUZZY_MATCH_THRESHOLD:
                    product_urls.append((href, title))
                    print(f"🟢 Matched ({similarity}%): {title}")

        print(f"✅ Found {len(product_urls)} results on {site_name}.")

    except Exception as e:
        print(f"⚠️ Error scraping {site_name}: {e}")

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
    user_input = input("Enter product name to search: ").strip()
    query = quote_plus(user_input)

    site_configs = [
        {
            "site_name": "Ozone.bg",
            "search_url": f"https://www.ozone.bg/instantsearchplus/result/?q={query}",
            "result_selector": "a.isp_product_image_href",
            "base_url": "https://www.ozone.bg",
            "user_input": user_input
        },
        # {
        #     "site_name": "Technopolis.bg",
        #     "search_url": f"https://www.technopolis.bg/bg/search/{query}",
        #     "result_selector": "a.product-box__title-link",
        #     "base_url": "https://www.technopolis.bg",
        #     "user_input": user_input
        # },
        # {
        #     "site_name": "Emag.bg",
        #     "search_url": f"https://www.emag.bg/search/{query}",
        #     "result_selector": "a.card-v2-title",
        #     "base_url": "https://www.emag.bg",
        #     "user_input": user_input
        # }
    ]

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=False)
        pages = [await browser.new_page() for _ in site_configs]

        # Launch all scraping tasks
        tasks = [
            search_and_get_all_results(
                page,
                site["site_name"],
                site["search_url"],
                site["result_selector"],
                site["base_url"],
                site["user_input"]
            )
            for page, site in zip(pages, site_configs)
        ]

        results = await asyncio.gather(*tasks)
        await browser.close()

        all_urls = [url for sublist in results for (url, _) in sublist]

        filtered_urls = filter_urls_by_query_relaxed(all_urls, user_input)
        print("\n🎯 All Found Product URLs:")
        for url in filtered_urls:
            print(f"👉 {url}")


if __name__ == "__main__":
    asyncio.run(main())
