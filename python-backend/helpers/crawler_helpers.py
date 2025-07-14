import re
from playwright.async_api import Page, ElementHandle
from sentence_transformers import SentenceTransformer, util
import numpy as np

from configs.product_schemas_configs import USER_SELECTABLE_CATEGORIES 

async def extract_and_match_filter_values(
    section: ElementHandle,
    selector: str,
    regex: str = None,
    match_logic: callable = None
) -> list[str]:
    """
    Extracts text from filter value elements and returns those that match a given logic.
    Can use either a regex with a matcher function or a simple text-based match_logic.

    Args:
        section: The ElementHandle for the filter section (e.g., "Price", "Brand").
        selector: The CSS selector for the individual filter options (checkboxes/links).
        regex: An optional regex pattern to extract parts of the option text.
        match_logic: A callable that returns True for a desired match.
                     It receives a regex match object if `regex` is used,
                     otherwise it receives the full option text.

    Returns:
        A list of matching option texts.
    """
    matched_values = []
    value_elements = await section.query_selector_all(selector)
    for element in value_elements:
        text = (await element.inner_text()).strip()
        if not text:
            continue
            
        if regex and match_logic:
            match = re.search(regex, text, re.IGNORECASE)
            if match and match_logic(match):
                matched_values.append(text)
        elif match_logic and match_logic(text):
             matched_values.append(text)
             
    return matched_values


async def click_matching_filter(page: Page, selectors: dict, text_to_match: str) -> bool:
    """Finds a filter option by its exact text and clicks it."""
    try:
        # A locator that finds the element by its text content.
        locator = page.locator(f"{selectors['values']}:has-text('{text_to_match}')").first
        await locator.scroll_into_view_if_needed()
        await locator.click()
        return True
    except Exception as e:
        print(f"DEBUG: Could not click '{text_to_match}' using locator. Error: {e}")
        return False


def filter_urls_by_query_relaxed(urls: list[str], query: str) -> list[str]:
    """Filters a list of URLs to ensure all parts of the query are present in the URL path."""
    query_tokens = [token for token in query.lower().split() if token]
    if not query_tokens:
        return urls
        
    filtered_urls = []
    for url in urls:
        # Check against a normalized version of the URL
        url_path = url.lower().replace('-', ' ').replace('_', ' ')
        if all(token in url_path for token in query_tokens):
            filtered_urls.append(url)
    return filtered_urls


def get_semantic_similarity(query: str, corpus: list[str], MODEL: SentenceTransformer) -> list[float]:
    """
    Calculates the cosine similarity between a single query string and a list of other strings.
    
    Args:
        query: The user's input string.
        corpus: A list of strings from the website to compare against.

    Returns:
        A list of similarity scores (from -1 to 1), one for each item in the corpus.
    """
    if not corpus:
        return []

    # Encode the query and corpus into vector embeddings
    query_embedding = MODEL.encode(query, convert_to_tensor=True)
    corpus_embeddings = MODEL.encode(corpus, convert_to_tensor=True)

    # Compute cosine similarity
    cosine_scores = util.cos_sim(query_embedding, corpus_embeddings)

    # Convert the result to a simple list of floats
    return cosine_scores[0].cpu().numpy().tolist()

def get_user_criteria() -> dict[str, any]:
    """
    Prompts the user for a search query and multiple filters, then
    constructs and returns the criteria dictionary.
    """
    print("--- Product Search & Filter Setup ---")

    print("Please choose a category for the products you want to search for:")

    unknown_index = USER_SELECTABLE_CATEGORIES.index("Unknown")
    USER_SELECTABLE_CATEGORIES[unknown_index] = "Друга категория"

    for i, category_option in enumerate(USER_SELECTABLE_CATEGORIES):
        print(f"  {i+1}. {category_option}")
    
    user_choice = -1
    while user_choice < 1 or user_choice > len(USER_SELECTABLE_CATEGORIES):
        try:
            choice_str = input(f"Enter the number of your choice (1-{len(USER_SELECTABLE_CATEGORIES)}): ")
            user_choice = int(choice_str)
        except ValueError:
            print("Invalid input. Please enter a number.")
    
    # Determine the chosen category string
    selected_category: str = USER_SELECTABLE_CATEGORIES[user_choice - 1]
    print(f"\nYou have selected the category: '{selected_category}'\n")

    while not (query := input(" What product are you looking for? \n   ").strip()):
        print("    Search query cannot be empty. Please try again.")
    print(f"    Searching for: {query}\n")

    # Get filters in a loop
    filters: dict[str,str] = {}
    print(" Now, let's add some filters. (Press Enter on an empty filter name to finish / exit)")
    
    while True:
        filter_name = input("   - Filter Name (e.g., Цена, Color): ").strip()
        if not filter_name:
            if not filters:
                print("    No filters were added.\n")
            else:
                print("    Finished adding filters.\n")
            break

        print(f"     Enter value(s) for '{filter_name}'.")
        print("     - For price / range  value(s), use 'min-max' (e.g., 1500-2500).")
        print("     - For single / multiple text value(s), separate with a comma.")
        filter_value = input("     Value(s): ").strip()

        if filter_value:
            filters[filter_name] = filter_value
            print(f"    Added Filter: {filter_name} = {filter_value}\n")
        else:
            print(f"    Filter '{filter_name}' was not added because the value was empty.\n")
            
    criteria = {
        "category": selected_category,
        "query": query,
        "filters": filters
    }
    
    return criteria