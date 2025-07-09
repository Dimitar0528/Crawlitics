import json
import pandas as pd
import plotly.express as px
import time
from typing import Iterator, List, Dict, Any

from agno.agent import Agent, RunResponseEvent
from agno.models.ollama import Ollama
from agno.tools import tool
from agno.exceptions import AgentRunException, StopAgentRun
from helpers.helpers import clean_output

# --- AGENT DEFINITION ---
# The agent's prompt is updated to request a more sophisticated structure for categorical specs.
spec_weight_generation_agent = Agent(
    model=Ollama(id="gemma3:latest", options={'num_ctx': 48000, 'temperature': 0}),
    description="You are an expert product data analyst specializing in performance profiling.",
    instructions=[
        """
        For the given product category and specifications, you MUST return a JSON object defining the performance profile for each spec.
        Your output MUST be a single, valid JSON object and nothing else.
        You MUST categorise EVERY SINLGE SPECIFICATION GIVEN in one of these categories and include EACH OF THEM in the final JSON output.

    --- GUILDS PRINCIPLES FOR WEIGHTING ---
    Before assigning weights, you MUST strictly follow this classification methodology.
    This logic applies universally to ANY given product category (e.g., laptops, cars, cameras, drills).

     
 TIER 1: Core Performance Specs (Weight: ~0.3 - 0.5)
 DEFINITION: The primary 'engine' or 'brain' of the product. These are the 2-4 specs that most
             fundamentally define its raw power and ability to perform its core task.
 EXAMPLES:
   - Laptop/Phone: Processor Model (e.g., "Intel Core Ultra 7"), Graphics Card (GPU)
   - Car: Engine Type/Power (e.g., "3.5L V6 Twin-Turbo"), Drivetrain (AWD/RWD)
   - Camera: Sensor Size (e.g., "Full-Frame", "APS-C")

 TIER 2: Key Feature Specs (Weight: ~0.15 - 0.3)
 DEFINITION: Critical components that define the *quality and nature* of the user's interaction.
             They are not the raw 'engine', but they make a product feel premium, last longer,
             or perform secondary functions well.
 EXAMPLES:
   - Laptop/Phone: RAM Amount, Storage *Type* (NVMe vs SATA), Display Refresh Rate, Battery Life, Camera Specifications
   - Car: Transmission Type (Automatic/Manual), Suspension Type, Infotainment System
   - Camera: Autofocus System, Image Stabilization (IBIS), Max Video Resolution

 
 TIER 3: Convenience & Secondary Specs (Weight: ~0.05 - 0.1)
 DEFINITION: Nice-to-have features or lower-impact specs that add value but are not critical
             to the primary or key secondary functions. This also includes the *capacity* of a
             feature (like storage size, as opposed to storage *type/speed*).
 EXAMPLES:
   - Laptop/Phone: Storage Size (GB), Webcam Quality, Port Selection, Fast Charging Speed
   - Car: Sunroof, Heated Seats, Number of USB Ports
   - Camera: EVF Resolution, LCD Screen Articulation, Weather Sealing

 TIER 4: User Preference Specs (Weight MUST be 0.0)
 DEFINITION: This is the most important rule. These are subjective specs that do not have an
             objectively "better" or "worse" value in terms of performance. Their value is
             determined entirely by the individual user's taste or needs.
 EXAMPLES:
   - Laptop/Phone: Color, Screen Size, Weight, Chassis Material (e.g. Aluminum vs Plastic)
   - Car: Exterior Color, Body Style (Sedan vs SUV), Interior Trim Material
   - Camera: Body Color, Physical Layout of Dials

 --- NEW CRITICAL RULE: The Principle of Holistic Specs ---
 You MUST prefer a single, high-level CATEGORICAL spec over multiple, fragmented NUMERIC specs.
 This prevents over-analyzing minor details.

   - GOOD (Holistic):  "processor": { "type": "categorical", "weight": 0.4, "value_map": {"Intel Core Ultra 7": 90, ...} }
   - BAD (Fragmented): "processor_cores":   { "type": "numeric", "weight": 0.05, ... },
                       "processor_ghz":     { "type": "numeric", "weight": 0.05, ... },
                       "processor_cache":   { "type": "numeric", "weight": 0.05, ... }

   - GOOD (Holistic):  "storage_type": { "type": "categorical", "weight": 0.2, "value_map": {"NVMe": 100, "SATA": 80} }
   - BAD (Fragmented): "storage_read_speed": { "type": "numeric", ... }, "storage_write_speed": { "type": "numeric", ... }

           --- JSON OUTPUT RULES ---
    For EACH SPECIFICATION provided, you MUST provide a dictionary with the following keys:

    - "type": The data type of the spec, either "numeric" or "categorical".
    - "weight": Its importance for overall performance (a float from 0.0 to 1.0) based on the principles above. **CRITICALLY, user preference specs MUST have a weight of 0.0.**

    --- Rules for "numeric" type ---
    - "realistic_min": The numeric value for a basic/low-end version.
    - "realistic_max": The numeric value for a high-end/excellent version.

    --- Rules for "categorical" type ---
    - "value_map": An object where keys are the string values from the data and values are their performance scores (from 0 to 100).
    - "default_score": A default performance score (from 0 to 100) for any value not in the 'value_map'.
    
        YOU MUST NOT forget to INCLUDE ALL specifications provided in the final JSON. YOU MUST NOT MISS ANY SINGLE ONE!
        
        --- EXAMPLE for "Smartphone" (Apply these universal principles to ANY product category). DON'T include the example json in the final response! ---

{
  "processor": { 
    "type": "categorical",
    "weight": 0.5,
    "default_score": 75,
    "value_map": {
      "Snapdragon 8 Gen 3": 100,
      "Apple A17 Pro": 100,
      "Google Tensor G3": 90,
      "Snapdragon 7s Gen 2": 80
    }
  },
  "ram": {
    "type": "numeric",
    "weight": 0.4,
    "realistic_min": 6,
    "realistic_max": 16
  },
  "refresh_rate": {
    "type": "numeric",
    "weight": 0.25,
    "realistic_min": 60,
    "realistic_max": 144
  },
  "camera": {
    "type": "categorical",
    "weight": 0.25,
    "default_score": 75,
    "value_map": {
      "50MP": 100,
      "48MP": 90,
      "12MP": 75
    }
  },
  "storage": {
    "type": "numeric",
    "weight": 0.2,
    "realistic_min": 128,
    "realistic_max": 1024
  },
  "battery_life": {
    "type": "numeric",
    "weight": 0.2,
    "realistic_min": 3500,
    "realistic_max": 5500
  },
  "display_technology": {
    "type": "categorical",
    "weight": 0.15,
    "default_score": 60,
    "value_map": {
      "Dynamic AMOLED 2X": 100,
      "OLED": 90,
      "LCD": 50
    }
  },
  "screen_size": {
    "type": "numeric",
    "weight": 0.0,
    "realistic_min": 6.0,
    "realistic_max": 7.0
  },
  "color": {
    "type": "categorical",
    "weight": 0.0,
    "default_score": 50,
    "value_map": {}
  }
}
        """
    ],
    reasoning=True,
    debug_mode=True,
    expected_output="A structured JSON object with performance profiles for each ans every single one of the specifications provided!",
)


# @tool(show_result=True, stop_after_tool_call=True)
def generate_price_vs_performance_scatter_plot(products: List[Dict]) -> str:
    """
    Generates an interactive Price vs. Performance scatter plot for a list of products.

    This tool automatically:
    1. Determines the product category from the input data.
    2. Uses an internal AI agent to generate performance profiles for all specifications.
    3. Calculates a holistic performance score based on both numeric and categorical weighted specs.
    4. Creates an interactive Plotly visualization.

    Args:
        products (List[dict]): A list of product data dictionaries.

    Returns:
        str: HTML string containing the interactive plot.
    Raises:
        StopAgentRun: If insufficient products are provided (< 2).
        AgentRunException: If data processing or plot generation fails.
    """
    try:
        start_time = time.perf_counter()
        if not products or len(products) < 2:
            raise StopAgentRun("Cannot generate a plot. At least two products are required.")

        # --- Step 1: Data Loading and Preparation ---
        print("--- [Plotter Tool] Step 1: Loading and preparing data...")
        product_category = products[0].get("product_category", "Unknown Product")
        df = pd.json_normalize(products, sep='_')
        spec_df = df[['name', 'price'] + [col for col in df.columns if col.startswith('specs_')]].copy()
        spec_df.columns = [c.replace('specs_', '') for c in spec_df.columns]
        all_specs = [col for col in spec_df.columns if col not in ['name', 'price']]

        # --- Step 2: Generate Performance Profiles via LLM Agent ---
        print(f"--- [Plotter Tool] Step 2: Requesting performance profiles for '{product_category}'...")
        weight_prompt = f"Product Category: {product_category}\nSpecifications: {all_specs}"
        response = spec_weight_generation_agent.run(weight_prompt)
        print(response.content)
        profiles = json.loads(clean_output(response.content))
        print("--- [Plotter Tool] Received profiles:", json.dumps(profiles, indent=2))

        # --- Step 3: Calculate Individual Spec Scores (Numeric & Categorical) ---
        print("--- [Plotter Tool] Step 3: Calculating scores for each specification...")
        scores_df = pd.DataFrame(index=spec_df.index)
        
        for spec, profile in profiles.items():
            if spec not in spec_df.columns or profile.get("weight", 0) == 0:
                continue

            spec_type = profile.get("type")
            
            # --- Numeric Scoring Logic ---
            if spec_type == "numeric":
                try:
                    # Clean the data to extract numbers
                    series = pd.to_numeric(spec_df[spec].astype(str).str.extract(r'([\d\.]+)', expand=False), errors='coerce')
                    
                    realistic_min = float(profile.get("realistic_min", 0))
                    realistic_max = float(profile.get("realistic_max", 1))
                    
                    if realistic_max - realistic_min == 0:
                        scores_df[spec] = 50.0 # Assign a neutral score if min/max are the same
                        continue
                        
                    # Clip, normalize to 0-1, then scale to 0-100
                    clipped_values = series.clip(realistic_min, realistic_max)
                    normalized_scores = (clipped_values - realistic_min) / (realistic_max - realistic_min) * 100
                    scores_df[spec] = normalized_scores.fillna(0) # Fill missing values with 0 score
                except (ValueError, TypeError) as e:
                    print(f"--- [Plotter Tool] Warning: Skipping numeric spec '{spec}' due to profile error: {e}")
            
            # --- Categorical Scoring Logic ---
            elif spec_type == "categorical":
                try:
                    value_map = profile.get("value_map", {})
                    default_score = float(profile.get("default_score", 50))
                    
                    # Use pandas .map() for efficient lookup and .fillna() for the default case
                    scores_df[spec] = spec_df[spec].astype(str).map(value_map).fillna(default_score)
                except (ValueError, TypeError) as e:
                    print(f"--- [Plotter Tool] Warning: Skipping categorical spec '{spec}' due to profile error: {e}")

        # --- Step 4: Calculate Final Weighted Performance Score ---
        print("--- [Plotter Tool] Step 4: Calculating final weighted performance scores...")
        spec_df['performance_score'] = 0.0
        total_weight = 0
        scored_specs = list(scores_df.columns)

        for spec in scored_specs:
            if spec in profiles:
                weight = float(profiles[spec].get("weight", 0))
                spec_df['performance_score'] += scores_df[spec] * abs(weight)
                total_weight += abs(weight)
        
        if total_weight > 0:
            spec_df['performance_score'] = (spec_df['performance_score'] / total_weight).round(2)
        else:
            # Handle case where no specs had weight
            spec_df['performance_score'] = 50.0

        # --- Step 5: Aggregate Data for Visualization ---
        print("--- [Plotter Tool] Step 5: Aggregating data for bubble chart...")
        agg_rules = {
            'count': ('name', 'size'),
            'product_names': ('name', lambda names: '<br>'.join(names))
        }
        for spec_col in all_specs: # Use all original specs for hover data
            if spec_col in spec_df.columns:
                agg_rules[spec_col] = (spec_col, 'first')

        agg_df = spec_df.groupby(['price', 'performance_score']).agg(**agg_rules).reset_index()

        # --- Step 6: Generate Interactive Plotly Chart ---
        print("--- [Plotter Tool] Step 6: Generating interactive Plotly bubble chart...")
        fig = px.scatter(
            agg_df, x="price", y="performance_score", size="count", size_max=40,
            title=f"Price vs. Performance for {product_category}",
             labels={"price": "Price", "performance_score": "Overall Performance Score", 
                    "count": "Overlapping products"},
            hover_name="product_names"
        )
        fig.update_layout(hoverlabel=dict(align="left"))
        fig.add_annotation(text="Best value: Top-Left", align='left', showarrow=False, xref='paper', yref='paper', x=0, y=1.05)

        print("--- [Plotter Tool] Step 7: Returning plot as HTML string...")
        html_content =  fig.to_html(full_html=False, include_plotlyjs='cdn')
        print("Sending the html output to the front-end")
        with open("data_analyst_agent/product_plot.html", "w", encoding="utf-8") as f:
            f.write("<h1>Product Value Scatter Plot</h1>")
            f.write(html_content)
        print("An interactive plot has been saved to 'product_plot.html'. Open this file in your browser to view it.")
        elapsed = time.perf_counter() - start_time
        print(f"\n AI agents run in : {elapsed:.2f} seconds")
    except Exception as e:
        print(f"Error in plot generation: {e}")
        # Re-raise as a specific exception type for the agent framework
        raise AgentRunException(f"Plot generation failed: {e}.")

def run_visualize_product_analysis_insights(products: List[Dict[str, Any]]):
    """
    Cleans the product data to a standardized format before passing it to the visualization agent.
    """
    cleaned_products = []
    for product in products:
        cleaned_product = {
            "name": product.get("name"),
            "brand": product.get("brand"),
            "price": product.get("price"),
            "product_category": product.get("product_category"),
            "specs": product.get("specs", {})
        }
        cleaned_products.append(cleaned_product)
    generate_price_vs_performance_scatter_plot(cleaned_products)