import pandas as pd
import difflib

inventory = pd.read_csv("../data/walmart_format(1).csv", encoding="utf-8-sig")
sustainable = pd.read_csv("../data/Sustainable_List.csv", encoding="utf-8-sig")

# Category mapping for better search results
CATEGORY_KEYWORDS = {
    "Fruits & Vegetables": [
        "fruit",
        "fruits",
        "vegetable",
        "vegetables",
        "produce",
        "fresh",
        "organic",
        "onion",
        "tomato",
        "potato",
        "apple",
        "banana",
    ],
    "Cooking Essentials": [
        "spice",
        "spices",
        "oil",
        "vinegar",
        "salt",
        "pepper",
        "cooking",
        "kitchen",
        "seasoning",
        "herbs",
    ],
    "Munchies": [
        "snack",
        "snacks",
        "chips",
        "crackers",
        "nuts",
        "munchies",
        "party",
        "finger food",
    ],
    "Dairy, Bread & Batter": [
        "milk",
        "dairy",
        "cheese",
        "yogurt",
        "bread",
        "butter",
        "cream",
        "eggs",
        "flour",
        "batter",
    ],
    "Beverages": [
        "drink",
        "drinks",
        "beverage",
        "beverages",
        "juice",
        "soda",
        "coffee",
        "tea",
        "water",
        "beer",
        "wine",
    ],
    "Packaged Food": ["canned", "packaged", "instant", "ready", "preserved", "tinned"],
    "Ice Cream & Desserts": [
        "ice cream",
        "dessert",
        "desserts",
        "sweet",
        "frozen",
        "ice",
        "cream",
    ],
    "Chocolates & Candies": [
        "chocolate",
        "candy",
        "candies",
        "sweet",
        "gum",
        "lollipop",
    ],
    "Meats, Fish & Eggs": [
        "meat",
        "fish",
        "chicken",
        "beef",
        "pork",
        "seafood",
        "protein",
        "eggs",
    ],
    "Biscuits": ["biscuit", "biscuits", "cookie", "cookies", "crackers"],
    "Personal Care": [
        "personal care",
        "shampoo",
        "soap",
        "toothpaste",
        "deodorant",
        "cosmetics",
        "hygiene",
    ],
    "Paan Corner": ["paan", "betel", "tobacco", "mouth freshener"],
    "Home & Cleaning": [
        "household",
        "home",
        "cleaning",
        "detergent",
        "soap",
        "brush",
        "cloth",
        "cleaner",
        "disinfectant",
        "laundry",
    ],
    "Health & Hygiene": [
        "health",
        "medicine",
        "vitamin",
        "supplement",
        "first aid",
        "bandage",
        "sanitizer",
    ],
}


def get_category_from_keywords(query):
    """Determine the most likely category based on query keywords."""
    query_lower = query.lower()
    category_scores = {}

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in query_lower)
        if score > 0:
            category_scores[category] = score

    if category_scores:
        return max(category_scores.keys(), key=lambda x: category_scores[x])
    return None


def search_by_category(category, limit=10):
    """Search for products within a specific category."""
    category_products = inventory[inventory["Category"] == category]
    available_products = category_products[
        (category_products["outOfStock"] == False)
        & (category_products["availableQuantity"] > 0)
    ]

    if available_products.empty:
        out_of_stock = category_products[category_products["outOfStock"] == True]
        if not out_of_stock.empty:
            return f"I found products in the {category} category, but they're currently out of stock. Please check back later!"
        else:
            return f"I'm sorry, we don't currently have any products in the {category} category."

    # Return top products from the category
    top_products = available_products.head(limit)
    product_list = []
    for _, row in top_products.iterrows():
        product_list.append(
            f"• {row['name']} - Available in {row['location']} ({row['availableQuantity']} units)"
        )

    response = f"Here are some available {category.lower()} items:\n" + "\n".join(
        product_list
    )

    if len(available_products) > limit:
        response += f"\n\nI found {len(available_products)} total items in this category. Let me know if you're looking for something specific!"

    return response


def search_inventory(product_name):
    lower_name = product_name.lower()

    # First, check if this might be a category search
    detected_category = get_category_from_keywords(product_name)

    # If it's a general category search (like "household items"), show category results
    category_terms = ["items", "products", "things", "stuff", "goods"]
    if any(term in lower_name for term in category_terms) and detected_category:
        return search_by_category(detected_category)

    # Try exact match first
    exact = inventory[inventory["name"].str.lower() == lower_name]
    if not exact.empty:
        row = exact.iloc[0]
        if row["outOfStock"] or row["availableQuantity"] == 0:
            return f"I'm sorry, but {row['name']} is currently out of stock."
        else:
            return (
                f"Great news! We have {row['name']} in stock. "
                f"You'll find it in {row['location']}, with {row['availableQuantity']} units available "
                f"({row['weightInGms']}g total)."
            )

    # No exact match: gather suggestions
    substr = inventory[inventory["name"].str.lower().str.contains(lower_name)]
    if not substr.empty:
        suggestions = substr.head(5)
    else:
        # If no substring match and we detected a category, search within that category
        if detected_category:
            category_results = search_by_category(detected_category, 5)
            return f"I couldn't find '{product_name}' specifically, but here are some {detected_category.lower()} options:\n\n{category_results}"

        # Fuzzy match suggestions
        names = inventory["name"].tolist()
        close = difflib.get_close_matches(product_name, names, n=5, cutoff=0.6)
        suggestions = inventory[inventory["name"].isin(close)]

    if suggestions.empty:
        # Last resort: if we detected a category, show category items
        if detected_category:
            return f"I couldn't find '{product_name}' specifically, but let me show you our {detected_category.lower()} section:\n\n{search_by_category(detected_category, 5)}"
        return f"I'm sorry, I couldn't find '{product_name}' in our inventory."

    # If only one suggestion, return its status
    if len(suggestions) == 1:
        row = suggestions.iloc[0]
        if row["outOfStock"] or row["availableQuantity"] == 0:
            return f"I'm sorry, but {row['name']} is currently out of stock."
        else:
            return (
                f"I found '{row['name']}', and it's available! "
                f"Check aisle {row['location']} — we have {row['availableQuantity']} units "
                f"({row['weightInGms']}g total)."
            )

    # Multiple suggestions: prompt user to choose
    print(
        f"I found multiple products matching '{product_name}'. Here are your top {len(suggestions)} options:"
    )
    for i, (_, row) in enumerate(suggestions.iterrows(), 1):
        print(
            f"{i}. {row['name']} ({row['availableQuantity']} units, {row['weightInGms']}g, {row['location']})"
        )
    while True:
        try:
            choice_input = input(
                f"Enter the number of the product you want (1-{len(suggestions)}), or 0 to cancel: "
            )
            if not choice_input:
                continue

            choice = int(choice_input)
            if choice == 0:
                return "Selection canceled. Let me know if there is anything else I can help with!"
            if choice < 1 or choice > len(suggestions):
                print(
                    f"Invalid choice. Please enter a number between 1 and {len(suggestions)}."
                )
                continue

            row = suggestions.iloc[choice - 1]
            if row["outOfStock"] or row["availableQuantity"] == 0:
                return f"I'm sorry, but {row['name']} is currently out of stock."
            else:
                return (
                    f"Great choice! {row['name']} is in aisle {row['location']} with {row['availableQuantity']} units "
                    f"({row['weightInGms']}g total) ready for you."
                )
        except ValueError:
            print("Invalid input. Please enter a valid number.")


def suggest_sustainable(product_name):
    match = sustainable[
        sustainable["Original Product"].str.lower().str.contains(product_name.lower())
    ]
    if not match.empty:
        row = match.iloc[0]
        return (
            f"For a sustainable option, consider '{row['Sustainable Alternative']}' "
            f"from aisle {row['Aisle Number']} as an alternative to '{row['Original Product']}'..."
        )
    return None


def search_inventory_quick(product_name):
    """Non-interactive version of search_inventory for batch ingredient checking."""
    lower_name = product_name.lower()

    # Try exact match first
    exact = inventory[inventory["name"].str.lower() == lower_name]
    if not exact.empty:
        row = exact.iloc[0]
        if row["outOfStock"] or row["availableQuantity"] == 0:
            return f"Out of stock"
        else:
            return f"Available in {row['location']} ({row['availableQuantity']} units)"

    # No exact match: gather suggestions
    substr = inventory[inventory["name"].str.lower().str.contains(lower_name)]
    if not substr.empty:
        suggestions = substr.head(3)  # Take top 3 for quick check
    else:
        # Fuzzy match suggestions
        names = inventory["name"].tolist()
        close = difflib.get_close_matches(product_name, names, n=3, cutoff=0.6)
        suggestions = inventory[inventory["name"].isin(close)]

    if suggestions.empty:
        return f"Not found in inventory"

    # If only one suggestion, return its status
    if len(suggestions) == 1:
        row = suggestions.iloc[0]
        if row["outOfStock"] or row["availableQuantity"] == 0:
            return f"'{row['name']}' - Out of stock"
        else:
            return f"'{row['name']}' - Available in {row['location']}"

    # Multiple suggestions: return the first available one
    for _, row in suggestions.iterrows():
        if not row["outOfStock"] and row["availableQuantity"] > 0:
            return f"Similar item '{row['name']}' - Available in {row['location']}"

    # All suggestions are out of stock
    return f"Multiple similar items found but all out of stock"


def list_all_categories():
    """List all available product categories."""
    categories = inventory["Category"].unique()
    available_categories = []

    for category in categories:
        category_count = len(
            inventory[
                (inventory["Category"] == category)
                & (inventory["outOfStock"] == False)
                & (inventory["availableQuantity"] > 0)
            ]
        )
        if category_count > 0:
            available_categories.append(
                f"• {category} ({category_count} items available)"
            )

    if available_categories:
        response = "Here are all our available product categories:\n" + "\n".join(
            available_categories
        )
        response += "\n\nJust ask me about any category you're interested in! For example, you can say 'show me household items' or 'I need cleaning products'."
        return response
    else:
        return "I'm sorry, but we don't have any products available at the moment."
