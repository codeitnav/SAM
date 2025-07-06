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
- "recipe": When the user wants a recipe for a product.
- "suggestion": When the user is asking for recommendations or ideas (e.g., "what should I get for a party?").
- "sustainability": When the user is asking for eco-friendly options.

From the query, you must identify:
- "intent": One of the four intents listed above.
- "product": The specific product name or a list of product names if multiple are mentioned.
- "filter": Any additional context, like an event ("diwali"), a theme ("healthy"), or a quality ("eco-friendly").

Examples:
- "Do you have onions?" -> {{"intent": "product_search", "product": "onions", "filter": ""}}
- "Suggest something for a birthday" -> {{"intent": "suggestion", "product": "", "filter": ""}}
- "I need a recipe for pasta" -> {{"intent": "recipe", "product": "pasta", "filter": ""}}
- "Do you have plastic cups and plates?" -> {{"intent": "product_search", "product": ["plastic cups", "plates"], "filter": ""}}

User query: "{query}"

Return a minified JSON object with no extra text or markdown.
""",
        }
    ]

    data = {
        "model": "mistralai/mistral-7b-instruct",  # You can change this to any OpenRouter-compatible model
        "messages": messages,
    }

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data
    )

    try:
        content = response.json()["choices"][0]["message"]["content"]
        # Debug output removed for cleaner CLI responses
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
You are a helpful and friendly shopping assistant. Your task is to summarize the following inventory search results into a single, conversational response. Combine the information naturally, as if you were speaking to a customer in a store.

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
