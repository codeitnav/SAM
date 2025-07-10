import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")


def extract_intent(query):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "HTTP-Referer": "http://localhost",
        "X-Title": "SAM-AI",
    }

    messages = [
        {
            "role": "user",
            "content": f"""
You are a smart shopping assistant. Your goal is to analyze a user\'s query and extract key information into a structured JSON format.

Here are the possible intents:
- "product_search": When the user is looking for a specific item.
- "category_search": When the user is looking for items within a category (e.g., "household items", "cleaning products", "snacks").
- "category_list": When the user wants to see all available categories (e.g., "what categories do you have?", "show me all sections", "What type of products do you have?").
- "recipe": When the user wants a recipe using some ingredients. (eg. "What can I make with eggs and flour?", "What can I cook with chicken and rice?")
- "dish_ingredients": When the user wants to know what ingredients they need for a specific dish (e.g., "what do I need for ramen?", "ingredients for pasta", "I want to cook ramen", "I want to eat ramen", "I want to make pasta", "I need ingredients for pizza").
- "suggestion": When the user is asking for recommendations or ideas (e.g., "what should I get for a party?").
- "sustainability": When the user is asking for eco-friendly options.
- "greeting": When the user is greeting or saying hello.
- "farewell": When the user is saying goodbye.
- "thank_you": When the user is expressing gratitude.
- "personal": When the user is asking personal questions about the AI.
- "conversational": When the user is making general conversation not related to shopping.
- "inappropriate": When the user uses inappropriate language.

From the query, you must identify:
- "intent": One of the intents listed above.
- "product": The specific product name or a list of product names if multiple are mentioned. For recipe queries, extract individual ingredients as separate items.
- "filter": Any additional context, like an event ("diwali"), a theme ("healthy"), or a quality ("eco-friendly").

Examples:
- "Do you have onions?" -> {{"intent": "product_search", "product": "onions", "filter": ""}}
- "I need household items" -> {{"intent": "category_search", "product": "household items", "filter": ""}}
- "Looking for cleaning products" -> {{"intent": "category_search", "product": "cleaning products", "filter": ""}}
- "Show me snacks" -> {{"intent": "category_search", "product": "snacks", "filter": ""}}
- "What categories do you have?" -> {{"intent": "category_list", "product": "", "filter": ""}}
- "Show me all sections" -> {{"intent": "category_list", "product": "", "filter": ""}}
- "What departments are available?" -> {{"intent": "category_list", "product": "", "filter": ""}}
- "Suggest something for a birthday" -> {{"intent": "suggestion", "product": "", "filter": ""}}
- "I need a recipe for pasta" -> {{"intent": "recipe", "product": "pasta", "filter": ""}}
- "What can I make with rice and chicken?" -> {{"intent": "recipe", "product": ["rice", "chicken"], "filter": ""}}
- "Recipe using eggs and flour" -> {{"intent": "recipe", "product": ["eggs", "flour"], "filter": ""}}
- "What do I need for ramen?" -> {{"intent": "dish_ingredients", "product": "ramen", "filter": ""}}
- "Ingredients for chocolate cake" -> {{"intent": "dish_ingredients", "product": "chocolate cake", "filter": ""}}
- "I want to eat ramen" -> {{"intent": "dish_ingredients", "product": "ramen", "filter": ""}}
- "I want to make pasta" -> {{"intent": "dish_ingredients", "product": "pasta", "filter": ""}}
- "Can you give me a recipe for pizza?" -> {{"intent": "recipe", "product": "pizza", "filter": ""}}
- "Do you have plastic cups and plates?" -> {{"intent": "product_search", "product": ["plastic cups", "plates"], "filter": ""}}
- "Hello" -> {{"intent": "greeting", "product": "", "filter": ""}}
- "Hi there" -> {{"intent": "greeting", "product": "", "filter": ""}}
- "Goodbye" -> {{"intent": "farewell", "product": "", "filter": ""}}
- "Thank you" -> {{"intent": "thank_you", "product": "", "filter": ""}}
- "Thanks for the help" -> {{"intent": "thank_you", "product": "", "filter": ""}}
- "Who are you?" -> {{"intent": "personal", "product": "", "filter": ""}}
- "What's the weather like?" -> {{"intent": "conversational", "product": "", "filter": ""}}
- "How was your day?" -> {{"intent": "conversational", "product": "", "filter": ""}}

User query: "{query}"

Return a minified JSON object with no extra text or markdown.
""",
        }
    ]

    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": messages,
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data
    )

    try:
        content = response.json()["choices"][0]["message"]["content"]
        return json.loads(content)
    except Exception as e:
        print("LLM Error:", e)
        return {"intent": "unknown", "product": "", "filter": ""}


def get_ai_recommendations(query):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "HTTP-Referer": "http://localhost",
        "X-Title": "SAM-AI",
    }

    messages = [
        {
            "role": "user",
            "content": f"""
You are a shopping assistant. Based on the user's request, suggest a list of 3-5 products that would be relevant.

Return ONLY a valid JSON array of strings. For example, for the query "I'm planning a movie night", you could return `["popcorn", "soda", "pizza", "candy"]`.

User query: "{query}"

Return a minified JSON array of strings.
""",
        }
    ]

    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": messages,
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data
    )

    try:
        content = response.json()["choices"][0]["message"]["content"]
        return json.loads(content)
    except Exception as e:
        print("LLM Error:", e)
        return []


def format_recipe_response(recipe_details):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "HTTP-Referer": "http://localhost",
        "X-Title": "SAM-AI",
    }

    # Convert the dictionary to a JSON string for the prompt
    details_json = json.dumps(recipe_details, indent=2)

    messages = [
        {
            "role": "user",
            "content": f"""
You are a helpful cooking assistant. Please format the following recipe details in a clear, user-friendly way. The user should be able to read this and start cooking right away. Make sure to include the ingredients, instructions, and any other relevant details from the provided JSON.

Recipe Details (JSON):
{details_json}

Return only the formatted recipe as a single string, with no extra text or explanations.
""",
        }
    ]

    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": messages,
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data
    )

    try:
        content = response.json()["choices"][0]["message"]["content"]
        return content
    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback to a simple formatted string if the API fails
        return f"Recipe details:\n{json.dumps(recipe_details, indent=2)}"


def format_inventory_response(inventory_results):
    """Formats a list of inventory search results into a single, natural response using an LLM."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "HTTP-Referer": "http://localhost",
        "X-Title": "SmartShoppingCLI",
    }

    # Combine the list of results into a single string for the prompt
    results_str = "\n".join(inventory_results)

    messages = [
        {
            "role": "user",
            "content": f"""
You are a helpful and friendly shopping assistant. Your task is to summarize the following inventory search results into a single, conversational response. Combine the information naturally, as if you were speaking to a customer in a store. If you find multiple items, mention them all in a friendly way. Also, if you find any items which are not sustainable, urge the user to consider more eco-friendly options. Make the response concise and engaging.

Here are the search results:
{results_str}

Now, please provide a summary. For example, if the results say two items are in stock, you could say something like: 'Yes, I found both of those for you! The Onions are in Aisle 1-a, and the Potatoes are in Aisle 1-f.' If an item is not found, mention that as well. After the summary, ask a relevant follow-up question, like 'Can I help you find anything else?' or 'Would you like a recipe for any of these items?'.
""",
        }
    ]

    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": messages,
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data
    )

    try:
        content = response.json()["choices"][0]["message"]["content"]
        return content
    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback to a simple formatted string if the API fails
        return "\n".join(inventory_results)


def format_dish_ingredients_response(dish_name, ingredients_info):
    """Formats dish ingredients information into a natural response using LLM."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "HTTP-Referer": "http://localhost",
        "X-Title": "SAM-AI",
    }

    ingredients_str = "\n".join(ingredients_info)

    messages = [
        {
            "role": "user",
            "content": f"""
You are a helpful shopping assistant. The user asked about ingredients for "{dish_name}".

Based on the inventory results below, provide a SHORT, friendly summary (3-4 Bullet points) that:
- Mentions how many ingredients are available in store
- Briefly notes the available ones with their locations
- Suggests alternatives for missing items only if critical

Keep it concise, natural, and encouraging.

Inventory results:
{ingredients_str}

Provide only a brief, conversational response.
""",
        }
    ]

    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": messages,
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data
    )

    try:
        content = response.json()["choices"][0]["message"]["content"]
        return content
    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback to a simple formatted string if the API fails
        return f"Ingredients needed for {dish_name}:\n{ingredients_str}"
