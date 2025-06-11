import re
from typing import List, Callable, Optional
from playwright.async_api import Page, ElementHandle
from sentence_transformers import SentenceTransformer, util
from typing import List
import numpy as np

async def extract_and_match_filter_values(
    section: ElementHandle,
    selector: str,
    regex: Optional[str] = None,
    match_logic: Optional[Callable] = None
) -> List[str]:
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


def filter_urls_by_query_relaxed(urls: List[str], query: str) -> List[str]:
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

print("Loading sentence-transformer model...")
MODEL = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded.")

def get_semantic_similarity(query: str, corpus: List[str]) -> List[float]:
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

# You can keep your other helper functions like click_matching_filter here too.
# ...