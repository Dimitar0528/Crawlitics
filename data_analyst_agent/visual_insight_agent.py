import random
import sys
import time
from typing import Iterator
import json
import pandas as pd
import plotly.express as px
import re
from agno.agent import Agent, RunResponseEvent
from agno.models.ollama import Ollama
from agno.tools import tool
import time
from agno.exceptions import AgentRunException, StopAgentRun

spec_weight_generation_agent = Agent(
    model=Ollama(id="gemma3:latest", options={'num_ctx': 16384, 'temperature': 0}),
    description="You are an expert product data analyst specializing in performance profiling",
    instructions=[
        """
    For the given product category and specifications, you MUST return a JSON object defining the performance profile for each spec.
    For each spec, provide:
    - "type": The data type of the spec, either "numeric" or "categorical".
    - "weight": Its importance for overall performance (from -1.0 to 1.0).
    - "realistic_min": For "numeric" types, the value for a basic/low-end version. For "categorical", set to 0.
    - "realistic_max": For "numeric" types, the value for a high-end/excellent version. For "categorical", set to 0.

    Example for "Smartphone":
    {
      "ram": {"type": "numeric", "weight": 0.4, "realistic_min": 4, "realistic_max": 16},
      "storage": {"type": "numeric", "weight": 0.2, "realistic_min": 128, "realistic_max": 1024},
      "battery_life": {"type": "numeric", "weight": 0.3, "realistic_min": 3500, "realistic_max": 5000},
      "camera": {"type": "numeric", "weight": 0.1, "realistic_min": 12, "realistic_max": 200},
      "refresh_rate": {"type": "numeric", "weight": 0.1, "realistic_min": 60, "realistic_max": 144},
      "processor": {"type": "categorical", "weight": 0.0, "realistic_min": 0, "realistic_max": 0},
      "display_technology": {"type": "categorical", "weight": 0.0, "realistic_min": 0, "realistic_max": 0},
      "color": {"type": "categorical", "weight": 0.0, "realistic_min": 0, "realistic_max": 0}
    }
        """
    ],
    expected_output="A structured JSON object with performance profiles for each specification",
)

def clean_output(raw_content:str) -> str:
    """Cleans up Markdown code block fences."""
    match = re.search(r'```(?:json)?\s*({.*?})\s*```', raw_content, re.DOTALL)
    if match:
        return match.group(1).strip()
    return re.sub(r"^```(?:json)?|```$", "", raw_content.strip(), flags=re.MULTILINE).strip()

@tool(show_result=True, stop_after_tool_call=True)
def generate_price_vs_performance_scatter_plot(products: list[dict]) -> str:
    """
    Generates an interactive Price vs. Performance scatter plot for a list of products.
    
    This tool automatically:
    1. Determines the product category from the input data
    2. Uses internal AI agent to generate performance weights for specifications
    3. Calculates performance scores based on weighted specifications
    4. Creates an interactive Plotly visualization
    
    Args:
        products (List[dict]): A list of product data dictionaries, each containing
            detailed product information including name, price, and specifications.
    
    Returns:
        str: HTML string containing the interactive plot
    Raises:
        StopAgentRun: If insufficient products provided (< 2)
        AgentRunException: If data processing fails
    """
    try:
        if not products or len(products) < 2:
            raise StopAgentRun("Cannot generate a plot. At least two products are required.")


        print("--- [Plotter Tool] Step 1: Loading initial data...")
        try:
            product_category = products[0].get("product_category", "Unknown Product")
            df = pd.json_normalize(products, sep='_')
            spec_df = df[['name', 'price'] + [col for col in df.columns if col.startswith('specs_')]].copy()
            spec_df.columns = [c.replace('specs_', '') for c in spec_df.columns]
            all_specs = [col for col in spec_df.columns if col not in ['name', 'price']]

        except Exception as e:
            return f"<p>Error during initial data processing: {e}</p>"

        print(f"--- [Plotter Tool] Step 2: Requesting performance profiles for category '{product_category}'...")
        weight_prompt = f"Product Category: {product_category}\nSpecifications: {all_specs}"
        response = spec_weight_generation_agent.run(weight_prompt)
        profiles = json.loads(clean_output(response.content))

        print("--- [Plotter Tool] Step 3: Selectively cleaning data based on LLM-provided types...")
        numeric_spec_cols = []
        for spec, profile in profiles.items():
            if profile.get("type") == "numeric" and spec in spec_df.columns:
                # use regex to extract the first number from the string
                extracted = spec_df[spec].astype(str).str.extract(r'([\d\.]+)', expand=False)
                # convert to numeric, coercing errors
                spec_df[spec] = pd.to_numeric(extracted, errors='coerce')
                numeric_spec_cols.append(spec)
            

        # data normalization
        print("--- [Plotter Tool] Step 4: Normalizing numeric specs against realistic standards...")
        normalized_df = pd.DataFrame(index=spec_df.index)
        for spec, profile in profiles.items():
            if profile.get("type") == "numeric" and spec in spec_df.columns:
                try:
                    weight = float(profile.get("weight", 0))
                    if weight == 0: continue
                    realistic_min = float(profile.get("realistic_min", 0))
                    realistic_max = float(profile.get("realistic_max", 1))
                    if realistic_max - realistic_min == 0:
                        normalized_df[spec] = 50.0 
                        continue
                    clipped_values = spec_df[spec].clip(realistic_min, realistic_max)
                    normalized_df[spec] = (clipped_values - realistic_min) / (realistic_max - realistic_min) * 100
                except (ValueError, TypeError):
                    print(f"--- [Plotter Tool] Warning: Skipping spec '{spec}' due to non-numeric profile values.")
                    continue

        # calculate performance score
        print("--- [Plotter Tool] Step 5: Calculating representative performance scores...")
        spec_df['performance_score'] = 0.0
        total_weight = 0
        for spec in numeric_spec_cols: 
            if spec in profiles and spec in normalized_df.columns:
                weight = float(profiles[spec].get("weight", 0))
                if weight != 0:
                    spec_df['performance_score'] += normalized_df[spec].fillna(0) * abs(weight)
                    total_weight += abs(weight)
        if total_weight > 0:
            spec_df['performance_score'] = (spec_df['performance_score'] / total_weight).round(2)

        # aggregate data
        print("--- [Plotter Tool] Step 6: Aggregating data points for bubble chart...")
        aggregation_rules = {
            'count': ('name', 'size'),
            'product_names': ('name', lambda names: '<br>'.join(names))
        }

        # Dynamically add a rule for each numeric spec to get the first value in the group
        for spec_col in numeric_spec_cols:
            if spec_col in spec_df.columns:
                aggregation_rules[spec_col] = (spec_col, 'first')

        # Group by the plot coordinates and apply the dynamic aggregation rules
        agg_df = spec_df.groupby(['price', 'performance_score']).agg(**aggregation_rules).reset_index()
        print("--- [Plotter Tool] Step 7: Generating interactive Plotly bubble chart...")

        hover_data_columns = {
            'price': True, 
            'performance_score': True, 
            'count': True,
            'product_names': False 
        }
        for col in numeric_spec_cols:
            if col in agg_df.columns:
                hover_data_columns[col] = True

        fig = px.scatter(
            agg_df,
            x="price",
            y="performance_score",
            size="count",
            size_max=50,
            title=f"Price vs. Performance ",
            labels={"price": "Product Price", "performance_score": "Performance Score (0-100) ", "count": "Products"},
            hover_name="product_names", 
            hover_data=hover_data_columns
        )

        # custom hover template
        hovertemplate = (
            "<b>%{hovertext}</b><br><br>"
            "<b>Price</b>: %{x}<br>"
            "<b>Performance Score</b>: %{y}<br>"
            "<b>Overlapping products</b>: %{marker.size}<br>"
            "<br>--- Representative Specs ---<br>"
        )

        for spec_col in numeric_spec_cols:
            if spec_col in agg_df.columns:
                display_name = spec_col.replace('_', ' ').title()
                hovertemplate += f"<b>{display_name}</b>: %{{customdata[{numeric_spec_cols.index(spec_col)}]}}<br>"

        custom_data_for_hover = [agg_df[col] for col in numeric_spec_cols if col in agg_df.columns]

        fig.update_traces(
            customdata=pd.DataFrame(custom_data_for_hover).T.values,
            hovertemplate=hovertemplate,
            textposition='top center', 
            textfont_size=8
        )

        fig.update_layout(
            hoverlabel=dict(
                align="left"
            )
        )
        fig.add_annotation(
            text="Best value: Top-Left",
            align='left', showarrow=False, xref='paper', yref='paper', x=0, y=1.05
        )

        print("--- [Plotter Tool] Step 8: Returning plot as HTML string...")
        html_output = fig.to_html(full_html=False, include_plotlyjs='cdn')
        return html_output
    except Exception as e:
        print(f"Error in plot generation: {e}")
        raise AgentRunException(f"Plot generation failed: {e}.")

    return html_output

def visualize_product_scatter_plot(products: list[dict]):
    start_time = time.perf_counter()

    visual_insight_agent = Agent(
        model=Ollama(id="PetrosStav/gemma3-tools:4b", options={ 'num_ctx': 48000, 'temperature':0}),
        tools=[generate_price_vs_performance_scatter_plot],
        instructions="""You are a helpful assistant that can use tools to generate visualizations. 
        When asked to create plots or analyze data, you should use the available tools by making function calls. Always use the tools directly. DO NOT describe what the tool does or provide markdown explanations of the tool""",
        exponential_backoff=True,
        retries=3,
        delay_between_retries=1
    )


    message = f"""
    Generate a value scatter plot for these products, visualizing their price-to-performance positioning.
    Product data:{json.dumps(products, indent=2, ensure_ascii=False)}
    """

    print("--- Running Main Agent ---")
    run_response: Iterator[RunResponseEvent] = visual_insight_agent.run(message, stream=True)

    for event in run_response:
        print(event.event)
        if event.event == "RunResponseContent":
            html_content = event.content
            print("Sending the html output to the front-end")
            with open("product_plot.html", "w", encoding="utf-8") as f:
                f.write("<h1>Product Value Scatter Plot</h1>")
                f.write(html_content)

            print("\n--- Agent Run Complete ---")
            elapsed = time.perf_counter() - start_time
            print(f"\n AI agents run in : {elapsed:.2f} seconds")

        elif event.event == "ToolCallStarted":
            print(f"\n--- AGENT IS CALLING TOOL: {event.tool.tool_name} ---\n")
        elif event.event == "RunResponseToolResult":
            print(f"\n--- TOOL RESULT ---\n{event.result}")
    print("An interactive plot has been saved to 'product_plot.html'. Open this file in your browser to view it.")

def run_visualize_product_scatter_plot(products):
    cleaned_products = []
    for _, product in products.items():
        light_product = {
            "name": product.get("name"),
            "brand": product.get("brand"),
            "price": product.get("price"),
            "product_category": product.get("product_category"),
            "specs": product.get("specs", {})
        }
        cleaned_products.append(light_product)
    visualize_product_scatter_plot(cleaned_products)