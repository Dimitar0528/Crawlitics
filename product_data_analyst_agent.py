from textwrap import dedent
from typing import List, Iterator

from agno.agent import Agent, RunResponse
from agno.models.ollama import Ollama
import json
from scraper_helpers import read_record_from_db
# Define the agent
product_data_analyst_agent = Agent(
    model=Ollama(id="gemma3:latest",
        options={
        'num_ctx': 48000,
        }),
    description=dedent("""\
        You are a highly skilled eCommerce data analyst AI agent.
        You specialize in comparing and ranking products based on real-world criteria like value, performance, and use case.
    """),
    instructions=dedent("""\
        You MUST generate a response that strictly adheres to the following Markdown format and instructions. Do not add any introductory text, concluding remarks, or notes outside of this required structure.

        ### **NON-NEGOTIABLE RULE: MAINTAIN HIGH DETAIL FOR ALL CATEGORIES**
    The quality, length, and detail of your `Reasoning`, `Trade-offs`, `Runneer-up` and `Honorable Mention:` sections MUST be consistent and high for ALL categories, from the first to the very last. DO NOT provide short or generic answers for later categories. Failure to maintain detail throughout is a failure to follow instructions.
                        
        ### **REQUIRED OUTPUT STRUCTURE** ###

        **Overall Ranking (Best to Worst)**

        1.  **[Product Name] - (price)**: [Provide a concise, one-sentence justification for its rank.]
        (Continue for the TOP 5 products ONLY!)

        **Detailed Analysis by Category**

        (Apply the following detailed format for ALL categories listed below)

           ### [Category Number]. [Category Name]
    *   **Winner:** [Full Product Name]  [Price]
        *   **Reasoning:** [**MANDATORY 3-4 SENTENCES.** Your reasoning MUST be detailed and data-driven. **You MUST cite specific values** from the JSON, such as `price` (e.g., "At 1499.00..."), `storage` (e.g., "...its 128 GB of storage..."), `camera` (e.g., "...the 200 MP camera..."), and `battery_life` (e.g., "...a large 5000 mAh battery..."). Directly compare the winner to other products to prove why it is the best for this specific category.]
        *   **Trade-offs:** [**MANDATORY 3-4 SENTENCES.** Your trade-offs section MUST be equally detailed. **You MUST explain the specific compromises by citing data.** For example: "While it wins on price, the user sacrifices the larger 6.8-inch screen and superior 'Corning Gorilla Armor' protection found on the S25 Ultra model, which costs 2399.00." Avoid generic statements. Be specific about what is being given up.]
    *   **Runner-up:** [Full Product Name]  [Price]
        *   **Reasoning:** [**1-2 detailed sentences.** Explain why this product is a strong contender, citing at least two specific data points (e.g., price, a key spec) as justification.]
    *   **Honorable Mention:** [Full Product Name]  [Price]
        *   **Reasoning:** [**1 detailed sentence.** Briefly explain why this product is also worth considering, citing a specific data point.]

        ---
        
        ### **EVALUATION CATEGORIES** ###
        
        You must evaluate and rank products across all of the following categories, using the detailed format shown above for each one:
    1.  **Best budget option:** (Focus on the lowest `price` while still having strong base specs).
    2.  **Best price-to-performance ratio:** (Find the sweet spot. Not the cheapest, but the one offering the most features like a larger screen, more storage, or better battery for a reasonable price increase).
    3.  **Best for everyday use:** (Balance of good `battery_life`, a clear `resolution`, and sufficient `storage` for general tasks for office, browsing, media setting).
    4.  **Best for gaming/extreme use:** (Prioritize the largest `screen_size`, highest `resolution`, largest `battery_life`, and a robust build mentioned in the `product_description`).
    5.  **Most future-proof:** (Focus on the absolute highest specs: `storage` of '512 GB' or '1 TB', premium materials like 'titanium frame', and the best overall features).
    6.  **Best for photography:** (judging by `camera` specs like MP and multiple lenses).
    7.  **Most portable:** (Strictly the model with the smallest `screen_size`, e.g., '6.2' inches is more portable than '6.8', compact design).
    8.  **Best overall design:** (Analyze the `product_description` for keywords like 'titanium frame', 'Corning Gorilla Armor', 'aluminuim frame' and 'Gorilla Glass Victus 2'. A titanium frame is superior to an aluminum one).
    9.  **Best warranty/support:** (Analyze the `product_description` for any mention of 'гаранция' (warranty) or special support offers. If all are the same, state that clearly with reasoning).
    10. **Best overall** – This is the product that performs **best across the most categories above**. It doesn’t need to be #1 in everything, but should rank highly in multiple important ones.
    """),
    markdown=True,
)

# Analyze a list of products and print structured output
def analyze_products(products: List[dict]):
    message = f"Here is a list of products (as JSON):\n{json.dumps(products, ensure_ascii=False, indent=2)}\n\nAnalyze, compare, and rank them as per your instructions."
    run_response: Iterator[RunResponse] = product_data_analyst_agent.run(message, stream=True)
    for chunk in run_response:
        print(chunk.content, end="", flush=True)

urls_to_process = [
    "https://www.ozone.bg/product/smartfon-samsung-galaxy-s25-5g-6-2-12gb-256gb-iceblue/",
    "https://www.ozone.bg/product/smartfon-samsung-galaxy-s25-5g-6-2-12gb-256gb-silver-shadow/",
    "https://www.ozone.bg/product/smartfon-samsung-galaxy-s25-5g-6-2-12gb-256gb-mint/",
    "https://www.ozone.bg/product/smartfon-samsung-galaxy-s25-5g-6-2-12gb-128gb-iceblue/",
    "https://www.ozone.bg/product/smartfon-samsung-galaxy-s25-ultra-5g-6-8-12gb-512gb-blue/"
]
found_products, urls_to_crawl = read_record_from_db(urls_to_process)

analyze_products(found_products)
