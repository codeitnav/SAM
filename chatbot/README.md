# SAM AI Core

This repository contains the core logic for a smart shopping assistant. It provides functionalities for product search, recommendations, recipe suggestions, and intent recognition, designed to be integrated into a larger application backend like FastAPI, Firebase, or Supabase.

## Features

- **Product Search**: Look up items in the inventory, check stock status, and find their location.
- **Fuzzy & Suggestive Search**: If an exact match isn't found, it suggests similar items.
- **Sustainable Alternatives**: Suggests eco-friendly alternatives for products.
- **Product Recommendations**: Recommends products based on themes (e.g., "party," "baking") or AI-powered suggestions for more abstract queries.
- **Recipe Finder**:
  - Searches a local database for recipes based on one or more ingredients.
  - Falls back to an external API (TheMealDB) if no local recipes are found.
- **Intent Recognition**: Uses a Large Language Model (LLM) to understand the user's intent (e.g., search, get a recipe, need a suggestion).
- **Text-to-Speech**: Converts text responses into audible speech.
- **Speech-to-Text**: Listens for user's voice input and converts it to text.

## Setup and Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    ```

2.  **Create a virtual environment and activate it:**

    ```bash
    python -m venv env
    source env/bin/activate  # On Windows, use `env\Scripts\activate`
    ```

3.  **Install the required dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

The application uses an external service (OpenRouter) for LLM-based features like intent recognition and AI recommendations. You need to provide an API key for this service.

1.  Create a file named `.env` in the root directory of the project.
2.  Add your API key to the `.env` file as follows:

    ```
    OPENROUTER_API_KEY="your_openrouter_api_key_here"
    ```

## Core Modules

- `chatbot/product_search.py`: Handles all inventory lookup logic.
- `chatbot/product_recommendation.py`: Manages product suggestions.
- `chatbot/recipe_fetcher.py`: Contains logic for finding recipes from the local CSV and the external API.
- `chatbot/llm_utils.py`: Interfaces with the LLM for intent extraction and AI-based recommendations.
- `chatbot/audio_utils.py`: Provides text-to-speech and speech-to-text functionalities.

## How to Use

You can import the functions from the core modules into your FastAPI application and create endpoints to expose their functionality.

### Example: Creating a FastAPI Endpoint for Product Search

```python
# in your main FastAPI file (e.g., main.py)

from fastapi import FastAPI, HTTPException
from chatbot.product_search import search_inventory

app = FastAPI()

@app.get("/search/")
def search_product(product_name: str):
    result = search_inventory(product_name)
    if "I'm sorry" in result:
        raise HTTPException(status_code=404, detail=result)
    return {"message": result}

```

This example demonstrates how to wrap the `search_inventory` function in a FastAPI endpoint. You can apply a similar pattern for other functionalities like recipe fetching or product recommendations.
