from textwrap import dedent
from typing import Iterator

from agno.agent import Agent, RunResponse
from agno.models.ollama import Ollama
import json

# Define the agent
product_ranking_analyst_agent = Agent(
    model=Ollama(id="gemma3:latest",
        options={
        'num_ctx': 48000,
        }),
    description=dedent("""\
        You are a highly skilled eCommerce data analyst AI agent.
        You specialize in comparing and ranking products based on real-world criteria like value, performance, and use case.
    """),
    instructions=dedent("""\
    ## Core Analysis Requirements
    - Generate responses in strict Markdown format
    - Maintain consistent detail across ALL categories
    - Cite specific JSON values (price, storage, camera, battery_life)
    - The quality, length, and detail of your `Reasoning`, `Trade-offs`, `Runneer-up` and `Honorable Mention:` sections MUST be consistent and high for ALL categories, from the first to the very last. DO NOT provide short or generic answers for later categories. Failure to maintain detail throughout is a failure to follow instructions.
                        
    ## Response Structure
    **Overall Ranking (Best to Worst). For the TOP 5 PRODUCTS ONLY!**
    1. **[Product Name] - (price)**: [One-sentence justification]
    
    **Detailed Analysis by Category**
    (Apply the following detailed format for ALL categories listed below EXACTLY AS IS)

           ### [Category Number]. [Category Name]
    *   **Winner:** [Full Product Name]
        *   **Reasoning:** [**MANDATORY 3-4 SENTENCES.** Your reasoning MUST be detailed and data-driven. **You MUST cite specific values** from the JSON, such as `price` (e.g., "At 1499.00..."), `storage` (e.g., "...its 128 GB of storage..."), `camera` (e.g., "...the 200 MP camera..."), and `battery_life` (e.g., "...a large 5000 mAh battery..."). Directly compare the winner to other products to prove why it is the best for this specific category.]
        *   **Trade-offs:** [**MANDATORY 3-4 SENTENCES.** Your trade-offs section MUST be equally detailed. **You MUST explain the specific compromises by citing data.** For example: "While it wins on price, the user sacrifices the larger 6.8-inch screen and superior 'Corning Gorilla Armor' protection found on the S25 Ultra model, which costs 2399.00." Avoid generic statements. Be specific about what is being given up.]
    *   **Runner-up:** [Full Product Name]
        *   **Reasoning:** [**1-2 detailed sentences.** Explain why this product is a strong contender, citing at least two specific data points (e.g., price, a key spec) as justification.]
    *   **Honorable Mention:** [Full Product Name]
        *   **Reasoning:** [**1 detailed sentence.** Briefly explain why this product is also worth considering, citing a specific data point.]
    
    ## Evaluation Categories
    1. Best budget option
    2. Best price-to-performance ratio
    3. Best for everyday use
    4. Best for gaming/extreme use
    5. Most future-proof
    6. Best for photography
    7. Most portable
    8. Best overall design
    9. Best warranty/support
    10. Best overall
"""),
    markdown=True,
)

# Analyze a list of products and print structured output
def analyze_and_rank_products(products: list[dict[str,any]]):
    """
    Analyzes and ranks a list of product dictionaries using the product_ranking_analyst_agent.

    This function sends the provided list of product data (formatted as JSON)
    to the AI agent, which analyzes, compares, and ranks the products across
    multiple evaluation categories such as best budget option, best for gaming,
    best design, and more. The agent returns the structured Markdown analysis
    as a streaming response.

    Args:
        products (list[dict[str,any]]): A list of product data dictionaries, each containing
            detailed product information.
    Returns:
        None:
    """
    message = f"Here is a list of products (as JSON):\n{json.dumps(products, ensure_ascii=False, indent=2)}\n\nAnalyze, compare, and rank them as per your instructions."
    run_response: Iterator[RunResponse] = product_ranking_analyst_agent.run(message, stream=True)
    for chunk in run_response:
        print(chunk.content, end="", flush=True)
