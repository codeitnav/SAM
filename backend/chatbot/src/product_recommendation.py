import pandas as pd
from .llm_utils import get_ai_recommendations

from .utils import inventory_csv_path

inventory = pd.read_csv(inventory_csv_path, encoding="utf-8-sig")

RECOMMENDATION_KEYWORDS = {
    "party": ["chips", "soda", "snacks", "dip", "nuts"],
    "birthday": ["cake", "candles", "balloons", "gift wrap", "card"],
    "italian": ["pasta", "tomato sauce", "olive oil", "parmesan", "basil"],
    "baking": ["flour", "sugar", "eggs", "butter", "chocolate chips"],
    "healthy": ["salad greens", "quinoa", "avocado", "tofu", "oats"],
    "breakfast": ["cereal", "oats", "milk", "coffee", "bread", "eggs"],
    "diwali": ["diya", "sweets", "lights", "lantern"],
    "eco-friendly": ["bamboo", "reusable", "cloth bag", "metal bottle"],
}


def recommend_products(query):
    """Recommends products from inventory based on query keywords or AI suggestions."""
    query = query.lower()
    search_terms = set()
    detected_theme = None

    # First, try to match keywords for a quick response
    for theme, keywords in RECOMMENDATION_KEYWORDS.items():
        if theme in query or any(keyword in query for keyword in keywords):
            search_terms.update(keywords)
            detected_theme = theme  # Capture the theme

    # If no keywords match, fall back to the AI model
    if not search_terms:
        print("...Thinking of some ideas for you...")
        search_terms = get_ai_recommendations(query)
        if not search_terms:
            return "I'm sorry, I couldn't come up with any recommendations for that. Could you try being more specific?"

    # Find unique products matching the search terms
    recommended_products = pd.DataFrame()
    for term in set(search_terms):
        matches = inventory[
            inventory["name"].str.lower().str.contains(term)
            & (inventory["outOfStock"] == False)
        ]
        recommended_products = pd.concat([recommended_products, matches])

    # Remove duplicates and limit to 5 suggestions
    recommended_products = recommended_products.drop_duplicates(subset=["name"]).head(5)

    return detected_theme, recommended_products
