import pandas as pd
import requests
import json
from bs4 import BeautifulSoup
from .llm_utils import format_recipe_response, format_dish_ingredients_response
from .audio_utils import speak
from .product_search import search_inventory, search_inventory_quick

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


async def handle_recipe_search(products_to_process, send, receive, input_method="text"):

    def speak_wrapper(text):
        if input_method == "voice":
            speak(text)

    # Clean up the products list - remove empty strings and short strings
    valid_products = [
        p.strip() for p in products_to_process if p and p.strip() and len(p.strip()) > 1
    ]

    if not valid_products:
        # speak_wrapper(
        #     "I need some ingredients to search for recipes. Could you tell me what ingredients you have?"
        # )
        return "I need some ingredients to search for recipes. Could you tell me what ingredients you have?"

    product_names = ", ".join(valid_products)
    # speak_wrapper(f"Searching for recipes with '{product_names}'...")
    await send(json.dumps({"message":f"Searching for recipes with '{product_names}'..."}))
    local_recipes = find_recipes_by_ingredient(valid_products)

    if local_recipes:

        recipe_text = f"Found {len(local_recipes)} recipes! Here are your top choices based on reviews:\n\n"
        for i, dish in enumerate(local_recipes, 1):
            recipe_text += f"{i}. {dish}\n"

        buttons = [str(i) for i in range(1, len(local_recipes) + 1)]
        buttons.append("Cancel")  # cancel option

        await send(json.dumps(
            {
                "message": recipe_text + "\nPlease select the recipe you want:",
                "buttons": buttons,
            }
        ))

        try:
            choice_input = await receive()

            if choice_input.lower() == "cancel":
                await send(json.dumps(
                    "Recipe selection canceled. Let me know if there's anything else I can help you with!"
                ))
                return

            try:
                choice = int(choice_input)
            except ValueError:
                await send(json.dumps(
                    {
                        "message": "Invalid input. Please select a valid option.",
                        "buttons": buttons,
                    }
                ))
                return
            if 1 <= choice <= len(local_recipes):
                chosen_dish = local_recipes[choice - 1]
                # speak_wrapper(f"Great choice! Fetching the recipe for {chosen_dish}...")
                await send(json.dumps({"message":f"Great choice! Fetching the recipe for {chosen_dish}..."}))

                # Step 3: Get details and format with LLM
                details = get_recipe_details(chosen_dish)
                if details:
                    formatted_recipe = format_recipe_response(details)
                    # speak_wrapper(formatted_recipe)
                    await send(json.dumps({"message":formatted_recipe}))
                else:
                    # speak_wrapper(
                    #     "I'm sorry, I couldn't retrieve the details for that recipe."
                    # )
                    await send(json.dumps({"message":
                        "I'm sorry, I couldn't retrieve the details for that recipe."
                    }))
            else:
                await send(json.dumps(
                    {
                        "message": "Invalid choice. Please select a valid option.",
                        "buttons": buttons,
                    }
                ))
        except (ValueError, IndexError):
            await send(json.dumps(
                {
                    "message": "Invalid input. Please select a valid option.",
                    "buttons": buttons,
                }
            ))

    else:
        # Step 4: Fallback to API if no local recipes are found
        # speak_wrapper(
        #     f"I couldn't find any recipes for '{product_names}' in our cookbook. Let me check online..."
        # )
        await send(json.dumps({"message":
            f"I couldn't find any recipes for '{product_names}' in our cookbook. Let me check online..."
        }))
        api_recipes = get_recipe_from_api(valid_products)
        if api_recipes:
            # speak_wrapper(f"Here are some online recipes for '{product_names}':")
            await send(json.dumps({"message":f"Here are some online recipes for '{product_names}':"}))
            for r in api_recipes:
                await send(json.dumps({"message":f"→ {r}"}))
        else:
            # speak_wrapper(
            #     f"Sorry, I couldn't find any specific recipes for '{product_names}' online either."
            # )
            await send(json.dumps({"message":
                f"Sorry, I couldn't find any specific recipes for '{product_names}' online either."
            }))


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


async def handle_dish_ingredients_search(
    dish_name, send, receive, inventory_csv_url, input_method="text"
):
    """Main function to handle dish ingredients search and inventory check."""

    def speak_wrapper(text):
        if input_method == "voice":
            speak(text)

    # speak_wrapper(f"Let me find the ingredients needed for {dish_name}...")
    await send(json.dumps({"message":f"Let me find the ingredients needed for {dish_name}..."}))

    # Step 1: Try to get ingredients from local database
    local_dish_info = get_dish_ingredients_from_local(dish_name)

    if local_dish_info:
        # speak_wrapper(f"Found {local_dish_info['dish_name']} in our recipe database!")
        await send(json.dumps({"message":f"Found {local_dish_info['dish_name']} in our recipe database!"}))
        ingredients = local_dish_info["ingredients"]
        final_dish_name = local_dish_info["dish_name"]
    else:
        # Step 2: Fallback to API
        # speak_wrapper(f"Let me check online for {dish_name} ingredients...")
        await send(json.dumps({"message":f"Let me check online for {dish_name} ingredients..."}))
        api_dish_info = get_dish_ingredients_from_api(dish_name)

        if api_dish_info:
            # speak_wrapper(f"Found {api_dish_info['dish_name']} online!")
            await send(json.dumps({"message":f"Found {api_dish_info['dish_name']} online!"}))
            ingredients = api_dish_info["ingredients"]
            final_dish_name = api_dish_info["dish_name"]
        else:
            # speak_wrapper(
            #     f"Sorry, I couldn't find ingredients for {dish_name}. Please try a different dish name."
            # )
            await send(json.dumps({"message":
                f"Sorry, I couldn't find ingredients for {dish_name}. Please try a different dish name."
            }))
            return

    # Step 3: Display all ingredients first
    # speak_wrapper(f"Here are the ingredients needed for {final_dish_name}:")
    await send(json.dumps({"message":f"\nIngredients needed for {final_dish_name}:"}))
    await send(json.dumps({"message":"=" * 50}))

    for i, ingredient in enumerate(ingredients, 1):
        await send(json.dumps({"message":f"{i:2d}. {ingredient}"}))

    await send(json.dumps({"message":"=" * 50}))

    # Step 4: Ask if user wants to check store availability
    await send(json.dumps(
        {
            "message": "\nWould you like me to check which of these ingredients are available in our store?",
            "buttons": ["Yes", "No"],
        }
    ))

    while True:
        check_store = str(await receive()).lower().strip()

        if check_store in ["yes", "y", "yeah", "yep", "sure"]:
            # Step 5: Check each ingredient in inventory
            # speak_wrapper("Checking store availability...")
            await send(json.dumps({"message":"\n🏪 Checking store availability..."}))

            ingredients_info = []
            available_count = 0
            available_items = []
            unavailable_items = []

            for ingredient in ingredients:
                # Clean up ingredient name (remove measurements and extra words)
                clean_ingredient = clean_ingredient_name(ingredient)
                result = search_inventory_quick(clean_ingredient, inventory_csv_url)

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
            await send(json.dumps({"message":f"\n💬 {formatted_response}"}))
            # speak_wrapper(formatted_response)
            break

        elif check_store in ["no", "n", "nope", "nah"]:
            # speak_wrapper(
            #     "Got it! You have the complete ingredients list. Happy cooking!"
            # )
            await send(json.dumps({"message":
                "Got it! You have the complete ingredients list. Happy cooking! 👨‍🍳"
            }))
            break
        else:
            await send(json.dumps({"message":"Please answer with 'yes' or 'no'."}))


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
