import re

async def extract_and_match_filter_values(section, value_selector, regex_pattern, filter_func=None):
    """
    Extracts filter values from a webpage section using a selector, applies a regex to match the values,
    and optionally filters them using a custom function.

    Args:
        section (ElementHandle): The section element containing the filter options.
        value_selector (str): The CSS selector used to target individual filter values within the section.
        regex_pattern (str): The regular expression pattern used to extract and validate the text content.
        filter_func (Callable, optional): A function that takes a regex match object and returns True if the value
                                          should be included. Defaults to None (include all matches).

    Returns:
        list[str]: A list of cleaned and matched filter values (text) from the section.
    """
    elements = await section.query_selector_all(value_selector)
    matched_values = []

    for element in elements:
        raw_text = await element.inner_text()
        normalized_text = raw_text.replace("\u00a0", " ").strip()
        cleaned_text = re.sub(r"\s*\(\d+\)$", "", normalized_text)
        match = re.search(regex_pattern, cleaned_text, re.IGNORECASE)

        if match and (filter_func is None or filter_func(match)):
            matched_values.append(cleaned_text)

    return matched_values

async def click_matching_filter(page, side_filter_selectors, filter):
    """
    Attempts to find and click a filter option on a webpage that matches the specified text.

    Args:
        page (Page): The Playwright page instance to operate on.
        side_filter_selectors (dict): A dictionary of selectors, where "values" corresponds to the filter value items.
        filter (str): The normalized filter text to match and click.

    Returns:
        bool: True if a matching filter was found and clicked, False otherwise.
    """
    try:
        elements = page.locator(side_filter_selectors["values"])
        count = await elements.count()
        for i in range(count):
            text = await elements.nth(i).inner_text()
            normalized = text.replace("\u00a0", " ").strip()
            if filter in normalized:
                await page.wait_for_timeout(50)
                await elements.nth(i).click()
                return True
    except Exception as e:
        print(f" Failed to click price filter: {e}")
    return False