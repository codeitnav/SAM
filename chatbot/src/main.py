from llm_utils import (
    extract_intent,
    format_inventory_response,
)
from recipe_fetcher import handle_recipe_search, handle_dish_ingredients_search
from audio_utils import speak, listen
from product_search import (
    search_inventory,
    suggest_sustainable,
    search_by_category,
    get_category_from_keywords,
    list_all_categories,
)
from product_recommendation import recommend_products
from conversational_handler import (
    get_conversational_response,
    is_personal_question,
    get_personal_response,
    is_thank_you,
)
import pandas as pd


def get_input(input_method):
    if input_method == "text":
        return input("\nAsk your query (or type 'exit'): ")
    else:
        print("Listening...")
        query = listen()
        print(f"You said: {query}")
        return query


def main():
    print("Hello there! I'm SAM AI, your friendly shopping assistant! 🛒")
    print("I can help you with:")
    print("  • Finding products in our inventory")
    print("  • Suggesting recipes and ingredients")
    print("  • Recommending sustainable alternatives")
    print("  • General shopping assistance")
    print("\nJust ask me anything related to shopping, and I'll do my best to help!")

    input_method = ""
    while input_method not in ["text", "voice"]:
        input_method = input("\nChoose your input method ('text' or 'voice'): ").lower()

    def speak_wrapper(text):
        if input_method == "voice":
            speak(text)

    while True:
        query = get_input(input_method)

        if query.lower() == "exit":
            print("Exiting chatbot. See you again!")
            break

        # First check for conversational responses
        conversational_response = get_conversational_response(query)
        if conversational_response:
            speak_wrapper(conversational_response)
            print(conversational_response)
            continue

        # Check for personal questions
        if is_personal_question(query):
            personal_response = get_personal_response()
            speak_wrapper(personal_response)
            print(personal_response)
            continue

        # Check for thank you messages
        if is_thank_you(query):
            thank_you_response = "You're very welcome! I'm always happy to help with your shopping needs. Is there anything else you'd like to find?"
            speak_wrapper(thank_you_response)
            print(thank_you_response)
            continue

        print("...Thinking...")
        parsed = extract_intent(query)
        intent = parsed.get("intent")
        product_data = parsed.get("product", "")
        filter_val = parsed.get("filter", "").strip()

        products_to_process = (
            [p.strip() for p in product_data]
            if isinstance(product_data, list)
            else [product_data.strip()]
        )

        if intent == "product_search":
            print("...Searching inventory...")
            inventory_results = []
            sustainable_suggestions = []
            for product in products_to_process:
                if not product:
                    continue
                result = search_inventory(product)

                # Check if user canceled the selection
                if "Selection canceled" in result:
                    speak_wrapper(result)
                    print(result)
                    return  # Exit early, don't process further or format with LLM

                inventory_results.append(result)
                # Proactive sustainable suggestion if available
                if "eco" not in filter_val and "sustain" not in filter_val:
                    alt = suggest_sustainable(product)
                    if alt:
                        sustainable_suggestions.append(alt)

            if inventory_results:
                formatted_response = format_inventory_response(inventory_results)
                speak_wrapper(formatted_response)
                print(formatted_response)

            if sustainable_suggestions:
                speak_wrapper("By the way, here are some sustainable alternatives:")
                print("\nBy the way, here are some sustainable alternatives:")
                for alt in sustainable_suggestions:
                    speak_wrapper(alt)
                    print(alt)

        elif intent == "category_search":
            print("...Searching category...")
            category_query = (
                " ".join(products_to_process)
                if products_to_process and any(products_to_process)
                else query
            )

            # First try to detect category from the query
            detected_category = get_category_from_keywords(category_query)
            if detected_category:
                category_results = search_by_category(detected_category)
                speak_wrapper(category_results)
                print(category_results)
            else:
                # Fallback to regular search
                inventory_results = []
                for product in products_to_process:
                    if not product:
                        continue
                    result = search_inventory(product)

                    # Check if user canceled the selection
                    if "Selection canceled" in result:
                        speak_wrapper(result)
                        print(result)
                        return  # Exit early, don't process further or format with LLM

                    inventory_results.append(result)

                if inventory_results:
                    formatted_response = format_inventory_response(inventory_results)
                    speak_wrapper(formatted_response)
                    print(formatted_response)
                else:
                    fallback_response = "I couldn't identify the specific category you're looking for. Could you be more specific? For example, you can ask for 'household items', 'cleaning products', 'snacks', etc."
                    speak_wrapper(fallback_response)
                    print(fallback_response)

        elif intent == "category_list":
            print("...Loading all categories...")
            categories_response = list_all_categories()
            speak_wrapper(categories_response)
            print(categories_response)

        elif intent == "recipe":
            print("...Finding recipes...")

            # Clean and process products for recipe search
            cleaned_products = []
            for product in products_to_process:
                if product and product.strip():
                    # Split comma-separated ingredients
                    if "," in product:
                        # Split by comma and clean each ingredient
                        split_ingredients = [ing.strip() for ing in product.split(",")]
                        cleaned_products.extend(
                            [ing for ing in split_ingredients if ing]
                        )
                    else:
                        cleaned_products.append(product.strip())

            # If we still don't have valid products, try to extract from the original query
            if not cleaned_products:
                # Try to extract ingredients from the query using simple keyword detection
                import re

                query_lower = query.lower()
                # Common food ingredients that might be mentioned
                common_ingredients = [
                    "rice",
                    "chicken",
                    "beef",
                    "pork",
                    "fish",
                    "eggs",
                    "milk",
                    "cheese",
                    "butter",
                    "flour",
                    "sugar",
                    "salt",
                    "pepper",
                    "onion",
                    "garlic",
                    "tomato",
                    "potato",
                    "carrot",
                    "celery",
                    "bell pepper",
                    "mushroom",
                    "spinach",
                    "lettuce",
                    "pasta",
                    "bread",
                    "oil",
                    "vinegar",
                    "lemon",
                    "lime",
                    "herbs",
                    "spices",
                ]
                found_ingredients = [
                    ing for ing in common_ingredients if ing in query_lower
                ]
                if found_ingredients:
                    cleaned_products = found_ingredients
                    print(f"Detected ingredients: {', '.join(found_ingredients)}")
                else:
                    print(
                        "Could not detect specific ingredients from your query. Please specify ingredients clearly."
                    )
                    return

            print(f"Searching for recipes with: {', '.join(cleaned_products)}")
            handle_recipe_search(cleaned_products, input_method)

        elif intent == "dish_ingredients":
            print("...Finding dish ingredients...")
            dish_name = (
                products_to_process[0]
                if products_to_process and products_to_process[0]
                else query
            )
            handle_dish_ingredients_search(dish_name, input_method)

        elif intent == "sustainability":
            print("...Finding sustainable alternatives...")
            for product in products_to_process:
                if not product:
                    continue
                suggestion = suggest_sustainable(product)
                if suggestion:
                    speak_wrapper(f"Absolutely! {suggestion}")
                    print(f"Absolutely! {suggestion}")
                else:
                    speak_wrapper(
                        f"I couldn't find a specific sustainable alternative for '{product}', but you can check out our eco-friendly section for more options!"
                    )
                    print(
                        f"I couldn't find a specific sustainable alternative for '{product}', "
                        "but you can check out our eco-friendly section for more options!"
                    )

        elif intent == "suggestion":
            print("...Generating recommendations...")
            query_for_suggestion = (
                " ".join(products_to_process)
                if products_to_process and any(products_to_process)
                else filter_val or query
            )
            theme, products = recommend_products(query_for_suggestion)
            if isinstance(products, pd.DataFrame) and not products.empty:
                suggestions_list = [
                    f"  - {row['name']} (in {row['location']})"
                    for _, row in products.iterrows()
                ]
                response_text = f"For your '{theme}' theme, I recommend:\n" + "\n".join(
                    suggestions_list
                )
                speak_wrapper(f"For your '{theme}' theme, I recommend:")
                print(response_text)
            else:
                response_text = "I couldn't find any specific recommendations for that. Would you like to try something else?"
                speak_wrapper(response_text)
                print(response_text)

        elif intent == "greeting":
            greeting_response = "Hello! I'm SAM AI, your shopping assistant. I can help you find products, suggest recipes, and recommend sustainable alternatives. What can I help you with today?"
            speak_wrapper(greeting_response)
            print(greeting_response)

        elif intent == "farewell":
            farewell_response = "Goodbye! Thanks for shopping with SAM AI. Come back anytime you need help with products or recipes!"
            speak_wrapper(farewell_response)
            print(farewell_response)

        elif intent == "thank_you":
            thank_you_response = "You're very welcome! I'm always happy to help with your shopping needs. Is there anything else you'd like to find?"
            speak_wrapper(thank_you_response)
            print(thank_you_response)

        elif intent == "personal":
            personal_response = get_personal_response()
            speak_wrapper(personal_response)
            print(personal_response)

        elif intent == "conversational":
            conv_response = "That's interesting, but I'm specifically designed to help with shopping assistance! I can help you find products, suggest recipes, or recommend sustainable alternatives. What would you like to shop for today?"
            speak_wrapper(conv_response)
            print(conv_response)

        elif intent == "inappropriate":
            inappropriate_response = "I appreciate your interest, but I'd prefer to keep our conversation respectful. How can I help you with your shopping needs today?"
            speak_wrapper(inappropriate_response)
            print(inappropriate_response)

        else:
            response_text = "I'm not sure I understood that. Could you please rephrase or ask about product availability, recipes, or sustainability?"
            speak_wrapper(response_text)
            print(response_text)


if __name__ == "__main__":
    main()
