import os
import json

# Define the special 'Unknown' schema as a fallback
UNKNOWN_SCHEMA = {
    "type": "object",
    "properties": {
        "product_name": {"type": "string"},
        "price": {"type": "string"},
        "brand": {"type": "string"},
        "guessed_category": {
            "type": "string",
            "description": "A product category that MUST BE written in Bulgarian (e.g., 'Компютър', 'Телефон', 'Телевизор'). The value must be a ONE OR MAX TWO singular noun(s) describing what the product fundamentally is, not its purpose, usage, or features. Start with a capital letter. Do not return adjectives like 'Гейминг', 'Бизнес', 'Смарт'"
        },
        "product_description": {
            "type": "string",
            "description": "A concise, human-readable summary of the product’s key features and benefits, written in a natural language paragraph. Highlight what makes the product useful or unique based ONLY on the provided text. The description should be in Bulgarian."
        },
        "attributes": {
            "type": "object",
            "description": (
                "A flat key-value map of all other specifications discovered in the product description. "
                "**All attribute keys must be written in English only**, in snake_case if needed. "
                "**All values must be in Bulgarian.** No keys should be written in Bulgarian. "
            ),
            "additionalProperties": True
        }
    },
    "required": ["product_name", "price", "brand", "guessed_category", "product_description", "attributes"]
}

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

if "Unknown" not in SCHEMAS:
    SCHEMAS["Unknown"] = UNKNOWN_SCHEMA
    
USER_SELECTABLE_CATEGORIES = list(SCHEMAS.keys())