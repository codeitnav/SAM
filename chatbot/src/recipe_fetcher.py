import pandas as pd
import requests
from bs4 import BeautifulSoup
from llm_utils import format_recipe_response, format_dish_ingredients_response
from audio_utils import speak
from product_search import search_inventory, search_inventory_quick

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

    query = products[0]

    # First try searching by dish name
    url = f"https://www.themealdb.com/api/json/v1/1/search.php?s={query}"

    try:
        r = requests.get(url)
        r.raise_for_status()
        data = r.json()

        if data.get("meals"):
            return [meal["strMeal"] for meal in data["meals"][:3]]

        # If no results by dish name, try by ingredient
        url = f"https://www.themealdb.com/api/json/v1/1/filter.php?i={query}"
        r = requests.get(url)
        r.raise_for_status()
        data = r.json()

        if data.get("meals"):
            return [meal["strMeal"] for meal in data["meals"][:3]]

        return []
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        return []
    except ValueError:  # Catches JSON decoding errors
        print("API Error: Could not decode JSON response.")
        return []


def handle_recipe_search(products_to_process, input_method="text"):

    def speak_wrapper(text):
        if input_method == "voice":
            speak(text)

    # Clean up the products list - remove empty strings and short strings
    valid_products = [
        p.strip() for p in products_to_process if p and p.strip() and len(p.strip()) > 1
    ]

    if not valid_products:
        speak_wrapper(
            "I need some ingredients to search for recipes. Could you tell me what ingredients you have?"
        )
        print(
            "I need some ingredients to search for recipes. Could you tell me what ingredients you have?"
        )
        return

    product_names = ", ".join(valid_products)
    speak_wrapper(f"Searching for recipes with '{product_names}'...")
    print(f"Searching for recipes with '{product_names}'...")
    local_recipes = find_recipes_by_ingredient(valid_products)

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
        api_recipes = get_recipe_from_api(valid_products)
        if api_recipes:
            speak_wrapper(f"Here are some online recipes for '{product_names}':")
            print(f"Here are some online recipes for '{product_names}':")
            for i, recipe in enumerate(api_recipes, 1):
                print(f"{i}. {recipe}")

            # Ask user to choose a recipe from API results
            try:
                choice_input = input(
                    f"Enter the number of the recipe you want (1-{len(api_recipes)}): "
                )
                choice = int(choice_input)
                if 1 <= choice <= len(api_recipes):
                    chosen_recipe = api_recipes[choice - 1]
                    speak_wrapper(
                        f"Great choice! Fetching the recipe for {chosen_recipe}..."
                    )
                    print(f"Great choice! Fetching the recipe for {chosen_recipe}...")

                    # Get full recipe details from API
                    api_details = get_recipe_details_from_api(chosen_recipe)
                    if api_details:
                        formatted_recipe = format_recipe_response(api_details)
                        speak_wrapper(formatted_recipe)
                        print(formatted_recipe)
                    else:
                        speak_wrapper(
                            "I'm sorry, I couldn't retrieve the details for that recipe."
                        )
                        print(
                            "I'm sorry, I couldn't retrieve the details for that recipe."
                        )
                else:
                    speak_wrapper("Invalid choice. Please try again.")
                    print("Invalid choice. Please try again.")
            except (ValueError, IndexError):
                speak_wrapper("Invalid input. Please enter a valid number.")
                print("Invalid input. Please enter a valid number.")
        else:
            speak_wrapper(
                f"Sorry, I couldn't find any specific recipes for '{product_names}' online either."
            )
            print(
                f"Sorry, I couldn't find any specific recipes for '{product_names}' online either."
            )


def get_dish_ingredients_from_local(dish_name):
    """Gets ingredients for a dish from the local CSV dataset."""
    if recipes_df.empty:
        return None

    match = recipes_df[recipes_df["Name"].str.lower().str.contains(dish_name.lower())]
    if not match.empty:
        # Get the best match (highest rated)
        best_match = match.sort_values(by="AggregatedRating", ascending=False).iloc[0]
        ingredients = best_match["RecipeIngredientParts"]

        # Parse ingredients (they're stored as a string representation of a list)
        try:
            import ast

            if isinstance(ingredients, str) and ingredients.startswith("c("):
                # Handle the specific format in the CSV
                ingredients_str = ingredients[2:-1]  # Remove 'c(' and ')'
                ingredients_list = [
                    ing.strip('"') for ing in ingredients_str.split('", "')
                ]
            else:
                ingredients_list = (
                    ast.literal_eval(ingredients)
                    if isinstance(ingredients, str)
                    else ingredients
                )

            return {
                "dish_name": best_match["Name"],
                "ingredients": ingredients_list,
                "rating": best_match["AggregatedRating"],
            }
        except Exception as e:
            print(f"Error parsing ingredients: {e}")
            return None
    return None


def get_dish_ingredients_from_api(dish_name):
    """Gets ingredients for a dish from TheMealDB API as a fallback."""
    url = f"https://www.themealdb.com/api/json/v1/1/search.php?s={dish_name}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        if data.get("meals") and len(data["meals"]) > 0:
            meal = data["meals"][0]
            ingredients = []

            # Extract ingredients from the API response
            for i in range(1, 21):  # TheMealDB has up to 20 ingredients
                ingredient = meal.get(f"strIngredient{i}")
                measure = meal.get(f"strMeasure{i}")

                if ingredient and ingredient.strip():
                    if measure and measure.strip():
                        ingredients.append(f"{measure.strip()} {ingredient.strip()}")
                    else:
                        ingredients.append(ingredient.strip())

            return {
                "dish_name": meal["strMeal"],
                "ingredients": ingredients,
                "instructions": meal.get("strInstructions", ""),
            }
        return None
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        return None
    except ValueError:
        print("API Error: Could not decode JSON response.")
        return None


def handle_dish_ingredients_search(dish_name, input_method="text"):
    """Main function to handle dish ingredients search and inventory check."""

    def speak_wrapper(text):
        if input_method == "voice":
            speak(text)

    speak_wrapper(f"Let me find the ingredients needed for {dish_name}...")
    print(f"Let me find the ingredients needed for {dish_name}...")

    # Step 1: Try to get ingredients from local database
    local_dish_info = get_dish_ingredients_from_local(dish_name)

    if local_dish_info:
        speak_wrapper(f"Found {local_dish_info['dish_name']} in our recipe database!")
        print(f"Found {local_dish_info['dish_name']} in our recipe database!")
        ingredients = local_dish_info["ingredients"]
        final_dish_name = local_dish_info["dish_name"]
    else:
        # Step 2: Fallback to API
        speak_wrapper(f"Let me check online for {dish_name} ingredients...")
        print(f"Let me check online for {dish_name} ingredients...")
        api_dish_info = get_dish_ingredients_from_api(dish_name)

        if api_dish_info:
            speak_wrapper(f"Found {api_dish_info['dish_name']} online!")
            print(f"Found {api_dish_info['dish_name']} online!")
            ingredients = api_dish_info["ingredients"]
            final_dish_name = api_dish_info["dish_name"]
        else:
            speak_wrapper(
                f"Sorry, I couldn't find ingredients for {dish_name}. Please try a different dish name."
            )
            print(
                f"Sorry, I couldn't find ingredients for {dish_name}. Please try a different dish name."
            )
            return

    # Step 3: Display all ingredients first
    speak_wrapper(f"Here are the ingredients needed for {final_dish_name}:")
    print(f"\n🍳 Ingredients needed for {final_dish_name}:")
    print("=" * 50)

    for i, ingredient in enumerate(ingredients, 1):
        print(f"{i:2d}. {ingredient}")

    print("=" * 50)

    # Step 4: Ask if user wants to check store availability
    while True:
        check_store = (
            input(
                "\nWould you like me to check which of these ingredients are available in our store? (yes/no): "
            )
            .lower()
            .strip()
        )

        if check_store in ["yes", "y", "yeah", "yep", "sure"]:
            # Step 5: Check each ingredient in inventory
            speak_wrapper("Checking store availability...")
            print("\n🏪 Checking store availability...")

            ingredients_info = []
            available_count = 0
            available_items = []
            unavailable_items = []

            for ingredient in ingredients:
                # Clean up ingredient name (remove measurements and extra words)
                clean_ingredient = clean_ingredient_name(ingredient)
                result = search_inventory_quick(clean_ingredient)

                # Format the result for display
                if (
                    "available" in result.lower()
                    and "out of stock" not in result.lower()
                ):
                    available_count += 1
                    available_items.append(ingredient)
                    ingredients_info.append(f" {ingredient}: {result}")
                else:
                    unavailable_items.append(ingredient)
                    ingredients_info.append(f" {ingredient}: {result}")

            # # Show compact summary
            # print(
            #     f"\n{available_count}/{len(ingredients)} ingredients available in store"
            # )

            # if available_items:
            #     print(f" Available: {', '.join(available_items)}")
            # if unavailable_items:
            #     print(f"Need to find: {', '.join(unavailable_items)}")

            # Step 6: Format response with LLM for a natural summary
            formatted_response = format_dish_ingredients_response(
                final_dish_name, ingredients_info
            )
            print(f"\n💬 {formatted_response}")
            speak_wrapper(formatted_response)
            break

        elif check_store in ["no", "n", "nope", "nah"]:
            speak_wrapper(
                "Got it! You have the complete ingredients list. Happy cooking!"
            )
            print("Got it! You have the complete ingredients list. Happy cooking! 👨‍🍳")
            break
        else:
            print("Please answer with 'yes' or 'no'.")


def clean_ingredient_name(ingredient):
    """Clean ingredient name to make it suitable for inventory search."""
    # Remove common measurements and extra words
    import re

    # Remove measurements like "1 cup", "2 tbsp", etc.
    ingredient = re.sub(
        r"^\d+[\d\s/]*\s*(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|lb|lbs|oz|ounce|ounces|pound|pounds|g|grams|kg|kilogram|kilograms|ml|liter|liters)\s*",
        "",
        ingredient,
        flags=re.IGNORECASE,
    )

    # Remove common adjectives and descriptors
    words_to_remove = [
        "fresh",
        "dried",
        "chopped",
        "diced",
        "sliced",
        "minced",
        "ground",
        "whole",
        "large",
        "small",
        "medium",
        "organic",
        "extra",
        "virgin",
        "all-purpose",
        "unsalted",
        "boneless",
        "skinless",
    ]

    for word in words_to_remove:
        ingredient = re.sub(r"\b" + word + r"\b", "", ingredient, flags=re.IGNORECASE)

    # Clean up extra spaces and return the first significant word(s)
    ingredient = re.sub(r"\s+", " ", ingredient).strip()

    # Take the first 1-2 words as the main ingredient
    words = ingredient.split()
    if len(words) >= 2:
        return " ".join(words[:2])
    elif len(words) == 1:
        return words[0]
    else:
        return ingredient


def get_recipe_details_from_api(recipe_name):
    """Gets full recipe details from TheMealDB API."""
    url = f"https://www.themealdb.com/api/json/v1/1/search.php?s={recipe_name}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        if data.get("meals") and len(data["meals"]) > 0:
            meal = data["meals"][0]

            # Extract ingredients with measurements
            ingredients = []
            for i in range(1, 21):  # TheMealDB has up to 20 ingredients
                ingredient = meal.get(f"strIngredient{i}")
                measure = meal.get(f"strMeasure{i}")

                if ingredient and ingredient.strip():
                    if measure and measure.strip():
                        ingredients.append(f"{measure.strip()} {ingredient.strip()}")
                    else:
                        ingredients.append(ingredient.strip())

            return {
                "Name": meal["strMeal"],
                "RecipeInstructions": meal.get("strInstructions", ""),
                "RecipeIngredientParts": ingredients,
                "AggregatedRating": "N/A",
                "RecipeCategory": meal.get("strCategory", ""),
                "CookTime": "N/A",
                "PrepTime": "N/A",
            }
        return None
    except requests.exceptions.RequestException as e:
        print(f"API Error: {e}")
        return None
    except ValueError:
        print("API Error: Could not decode JSON response.")
        return None
