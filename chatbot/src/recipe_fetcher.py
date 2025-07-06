import pandas as pd
import requests
from bs4 import BeautifulSoup
from llm_utils import format_recipe_response
from audio_utils import speak

# Load the local recipe dataset
try:
    recipes_df = pd.read_csv("../data/recipes.csv")
except FileNotFoundError:
    recipes_df = pd.DataFrame()


def find_recipes_by_ingredient(products):
    """Finds top 5 recipes from the local CSV based on a list of ingredients."""
    if recipes_df.empty:
        return []

    if isinstance(products, str):
        products = [products]

    matching_recipes = recipes_df.copy()
    for product in products:
        matching_recipes = matching_recipes[
            matching_recipes["RecipeIngredientParts"]
            .str.lower()
            .str.contains(product.lower())
        ]

    if matching_recipes.empty:
        return []

    # Sort by reviews and return the top 5 dish names
    top_recipes = matching_recipes.sort_values(
        by="AggregatedRating", ascending=False
    ).head(5)
    return top_recipes["Name"].tolist()


def get_recipe_details(dish_name):
    """Gets the full details for a chosen dish from the local CSV."""
    if recipes_df.empty:
        return None

    match = recipes_df[recipes_df["Name"].str.lower() == dish_name.lower()]
    if not match.empty:
        return match.iloc[0].to_dict()
    return None


def get_recipe_from_api(products):
    """Fetches recipe names from TheMealDB API as a fallback."""
    if isinstance(products, str):
        products = [products]

    # TheMealDB API for filtering by main ingredient
    # We will use the first product as the main ingredient for the query
    query = products[0]
    url = f"https://www.themealdb.com/api/json/v1/1/filter.php?i={query}"

    try:
        r = requests.get(url)
        r.raise_for_status()  # Raise an exception for bad status codes
        data = r.json()

        if data.get("meals"):
            # If other ingredients are provided, we can filter the results further
            # For now, we return the top 3 based on the primary ingredient
            return [meal["strMeal"] for meal in data["meals"][:3]]
        return []
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        return []
    except ValueError:  # Catches JSON decoding errors
        print("API Error: Could not decode JSON response.")
        return []


def handle_recipe_search(products_to_process, input_method="text"):
    """Handles the entire recipe search flow, from finding recipes to presenting them."""

    def speak_wrapper(text):
        if input_method == "voice":
            speak(text)

    product_names = ", ".join(products_to_process)
    speak_wrapper(f"Searching for recipes with '{product_names}'...")
    print(f"Searching for recipes with '{product_names}'...")
    local_recipes = find_recipes_by_ingredient(products_to_process)

    if local_recipes:
        speak_wrapper(
            f"Found {len(local_recipes)} recipes! Here are your top choices based on reviews:"
        )
        print(
            f"Found {len(local_recipes)} recipes! Here are your top choices based on reviews:"
        )
        for i, dish in enumerate(local_recipes, 1):
            print(f"{i}. {dish}")

        # Step 2: Ask the user to choose a recipe
        try:
            choice_input = input(
                f"Enter the number of the recipe you want (1-{len(local_recipes)}): "
            )
            choice = int(choice_input)
            if 1 <= choice <= len(local_recipes):
                chosen_dish = local_recipes[choice - 1]
                speak_wrapper(f"Great choice! Fetching the recipe for {chosen_dish}...")
                print(f"Great choice! Fetching the recipe for {chosen_dish}...")

                # Step 3: Get details and format with LLM
                details = get_recipe_details(chosen_dish)
                if details:
                    formatted_recipe = format_recipe_response(details)
                    speak_wrapper(formatted_recipe)
                    print(formatted_recipe)
                else:
                    speak_wrapper(
                        "I'm sorry, I couldn't retrieve the details for that recipe."
                    )
                    print("I'm sorry, I couldn't retrieve the details for that recipe.")
            else:
                speak_wrapper("Invalid choice. Please try again.")
                print("Invalid choice. Please try again.")
        except (ValueError, IndexError):
            speak_wrapper("Invalid input. Please enter a valid number.")
            print("Invalid input. Please enter a valid number.")

    else:
        # Step 4: Fallback to API if no local recipes are found
        speak_wrapper(
            f"I couldn't find any recipes for '{product_names}' in our cookbook. Let me check online..."
        )
        print(
            f"I couldn't find any recipes for '{product_names}' in our cookbook. Let me check online..."
        )
        api_recipes = get_recipe_from_api(products_to_process)
        if api_recipes:
            speak_wrapper(f"Here are some online recipes for '{product_names}':")
            print(f"Here are some online recipes for '{product_names}':")
            for r in api_recipes:
                print(f"→ {r}")
        else:
            speak_wrapper(
                f"Sorry, I couldn't find any specific recipes for '{product_names}' online either."
            )
            print(
                f"Sorry, I couldn't find any specific recipes for '{product_names}' online either."
            )
