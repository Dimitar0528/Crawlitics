import os
import json

def load_schemas_from_directory(directory="proposed_schemas"):
    """
    Loads all .json files from the specified directory into a dictionary.
    The filename (without .json) is used as the category key.
    """
    schemas = {}
    try:
        for filename in os.listdir(directory):
            if filename.endswith(".json"):
                category_name = os.path.splitext(filename)[0]
                filepath = os.path.join(directory, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    schemas[category_name] = json.load(f)
    except FileNotFoundError:
        print(f"  [Warning] Schema directory not found: '{directory}'. No external schemas loaded.")
        return {}
        
    return schemas
SCHEMAS = load_schemas_from_directory()

# Define the special 'Unknown' schema as a fallback
UNKNOWN_SCHEMA = {
    "type": "object",
    "properties": {
        "product_name": {"type": "string"},
        "price": {"type": "string",},
        "guessed_category": {
            "type": "string",
            "description": "The guessed category of the product. This should be a singular noun with the first letter capitalized."
        },
        "product_description": {
            "type": "string",
            "description": "A concise, human-readable summary of the product’s key features and benefits, written in a natural language paragraph. Highlight what makes the product useful or unique based ONLY on the provided text."
        },
        "attributes": {
            "type": "object",
            "description": "A key-value map of all other discovered specifications and their values.",
            "additionalProperties": True
        }
    },
    "required": ["product_name", "product_description", "guessed_category"]
}

if "Unknown" not in SCHEMAS:
    SCHEMAS["Unknown"] = UNKNOWN_SCHEMA