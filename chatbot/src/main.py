from llm_utils import (
    extract_intent,
    format_inventory_response,
)
from recipe_fetcher import handle_recipe_search
from audio_utils import speak, listen
from product_search import search_inventory, suggest_sustainable
from product_recommendation import recommend_products
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
    print("Hello there! I'm SAM AI. How can I help you today?")

    input_method = ""
    while input_method not in ["text", "voice"]:
        input_method = input("Choose your input method ('text' or 'voice'): ").lower()

    def speak_wrapper(text):
        if input_method == "voice":
            speak(text)

    while True:
        query = get_input(input_method)

        if query.lower() == "exit":
            print("Exiting chatbot. See you again!")
            break

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
            inventory_results = []
            sustainable_suggestions = []
            for product in products_to_process:
                if not product:
                    continue
                inventory_results.append(search_inventory(product))
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

        elif intent == "recipe":
            handle_recipe_search(products_to_process, input_method)

        elif intent == "sustainability":
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
            # Join multiple products into a single query for suggestions
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

        else:
            response_text = "I'm not sure I understood that. Could you please rephrase or ask about product availability, recipes, or sustainability?"
            speak_wrapper(response_text)
            print(response_text)


if __name__ == "__main__":
    main()
