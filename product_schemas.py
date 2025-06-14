SCHEMAS = {
    "Smartphone": {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "brand": {"type": "string"},
            "price": {"type": "string"},
            "product_description": {
                "type": "string",
                "description": "A concise, human-readable summary of the product’s key features, specifications, and benefits, written in natural language. This should highlight what makes the product useful or unique, based only on the content provided in the markdown."
            },
            "specs": {
                "type": "object",
                "properties": {
                    "processor": {"type": "string"},
                    "ram": {"type": "string"},
                    "storage": {"type": "string"},
                    "screen_size": {"type": "string"},
                    "resolution": {"type": "string"}, 
                    "refresh_rate": {"type": "string"},
                    "display_technology": {"type": "string"},
                    "camera": {"type": "string"},
                    "ports": {"type": "string"},
                    "SIM_type": {"type": "string"},
                    "battery_life": {"type": "string"},
                    "color": {"type": "string"},
                    "features": {"type": "string"},
                },
                "required": ["processor", "ram", "storage"]
            }
        },
        "required": ["name", "brand", "price", "product_description", "specs"]
    },
    # The fallback schema for everything else
    "Unknown": {
        "type": "object",
        "properties": {
            "product_name": {"type": "string"},
            "price": {"type": "string"},
            "guessed_category": {"type": "string"},
            "product_description": {
                "type": "string",
                "description": "A concise, human-readable summary of the product’s key features, specifications, and benefits, written in natural language. This should highlight what makes the product useful or unique, based only on the content provided in the markdown."
            },
            "attributes": {
                "type": "object",
                "description": "A key-value map of all discovered specifications.",
                "additionalProperties": True # Allows any key-value pairs
            }
        },
        "required": ["product_name"]
    }
}