import re
import random


def contains_inappropriate_language(query):
    """Check if the query contains inappropriate language."""
    inappropriate_patterns = [
        r"\b(fuck|shit|damn|bitch|ass|hell|stupid|idiot|moron|dumb)\b",
        r"\b(hate|kill|die|murder|attack)\b",
        r"\b(sex|porn|nude|naked)\b",
        r"\b(shut up|screw you|go to hell)\b",
    ]

    query_lower = query.lower()
    for pattern in inappropriate_patterns:
        if re.search(pattern, query_lower):
            return True
    return False


def is_greeting(query):
    """Check if the query is a greeting."""
    query_lower = query.lower().strip()

    # Check for exact greetings or greetings at the start of the sentence
    greeting_patterns = [
        r"^hello(\s|$|!|\?)",
        r"^hi(\s|$|!|\?)",
        r"^hey(\s|$|!|\?)",
        r"^greetings(\s|$|!|\?)",
        r"^good morning(\s|$|!|\?)",
        r"^good afternoon(\s|$|!|\?)",
        r"^good evening(\s|$|!|\?)",
        r"^howdy(\s|$|!|\?)",
        r"^sup(\s|$|!|\?)",
        r"^yo(\s|$|!|\?)",
        r"what's up",
        r"how are you",
        r"how do you do",
        r"nice to meet you",
    ]

    # Also check for standalone greetings
    exact_greetings = ["hello", "hi", "hey", "greetings", "howdy", "sup", "yo"]

    if query_lower in exact_greetings:
        return True

    return any(re.search(pattern, query_lower) for pattern in greeting_patterns)


def is_farewell(query):
    """Check if the query is a farewell."""
    farewells = [
        "bye",
        "goodbye",
        "see you",
        "farewell",
        "take care",
        "catch you later",
        "see ya",
        "later",
        "talk to you later",
        "have a good day",
        "good night",
    ]

    query_lower = query.lower().strip()
    return any(farewell in query_lower for farewell in farewells)


def is_thank_you(query):
    """Check if the query is a thank you message."""
    thank_you_patterns = [
        "thank you",
        "thanks",
        "thank u",
        "thx",
        "appreciate it",
        "much appreciated",
        "grateful",
        "cheers",
    ]

    query_lower = query.lower().strip()
    return any(pattern in query_lower for pattern in thank_you_patterns)


def is_shopping_related(query):
    """Check if the query is related to shopping or products."""
    shopping_keywords = [
        "buy",
        "purchase",
        "shop",
        "product",
        "item",
        "items",
        "store",
        "inventory",
        "price",
        "cost",
        "available",
        "stock",
        "recipe",
        "ingredients",
        "cook",
        "food",
        "eat",
        "meal",
        "dish",
        "need",
        "want",
        "looking for",
        "suggest",
        "recommend",
        "eco-friendly",
        "sustainable",
        "organic",
        "party",
        "birthday",
        "celebration",
        "festival",
        "diwali",
        "christmas",
        "grocery",
        "groceries",
        "supermarket",
        "walmart",
        "order",
        "delivery",
        "aisle",
        "section",
        "department",
        "produce",
        "dairy",
        "meat",
        "bread",
        "snacks",
        "beverages",
        "household",
        "home",
        "cleaning",
        "personal care",
        # Category-specific terms
        "fruits",
        "vegetables",
        "cooking",
        "spices",
        "munchies",
        "packaged",
        "desserts",
        "chocolates",
        "candies",
        "biscuits",
        "hygiene",
        "health",
        # Common food items that might be asked about
        "milk",
        "eggs",
        "bread",
        "butter",
        "cheese",
        "yogurt",
        "chicken",
        "beef",
        "fish",
        "rice",
        "pasta",
        "flour",
        "sugar",
        "salt",
        "pepper",
        "oil",
        "onion",
        "tomato",
        "potato",
        "apple",
        "banana",
        "orange",
        "carrot",
        "lettuce",
        "spinach",
        "garlic",
        "ginger",
        "lemon",
        "lime",
        "beans",
        "corn",
        "peas",
        "cabbage",
        "broccoli",
    ]

    # Also check for patterns like "do you have..." or "where is..."
    shopping_patterns = [
        r"do you have",
        r"where is",
        r"where can i find",
        r"looking for",
        r"need some",
        r"want some",
        r"find.*for me",
        r"got any",
        r"sell.*\?",
    ]

    query_lower = query.lower()

    # Check keywords first
    if any(keyword in query_lower for keyword in shopping_keywords):
        return True

    # Check patterns
    if any(re.search(pattern, query_lower) for pattern in shopping_patterns):
        return True

    return False


def get_conversational_response(query):
    """Generate appropriate conversational responses."""

    # FIRST: Check if this is clearly a shopping-related query - if so, don't handle conversationally
    if is_shopping_related(query):
        return None  # Let the main system handle shopping queries

    # Check for inappropriate language first
    if contains_inappropriate_language(query):
        responses = [
            "I appreciate your interest, but I'd prefer to keep our conversation respectful. How can I help you with your shopping needs today?",
            "Let's keep things friendly! I'm here to help you find products and recipes. What can I assist you with?",
            "I'd rather focus on helping you with shopping assistance. What products are you looking for today?",
        ]
        return random.choice(responses)

    # Handle greetings (but only if they're not shopping queries)
    if is_greeting(query):
        responses = [
            "Hello! I'm SAM AI, your shopping assistant. I can help you find products, suggest recipes, and recommend sustainable alternatives. What can I help you with today?",
            "Hi there! Welcome to SAM AI. I'm here to help you with all your shopping needs - from finding products to discovering recipes. How can I assist you?",
            "Hey! Great to see you. I'm SAM AI, and I specialize in helping with shopping, recipes, and finding eco-friendly alternatives. What are you looking for today?",
            "Hello! I'm your friendly shopping assistant SAM AI. Whether you need products, recipes, or sustainable options, I'm here to help. What can I do for you?",
        ]
        return random.choice(responses)

    # Handle farewells
    if is_farewell(query):
        responses = [
            "Goodbye! Thanks for shopping with SAM AI. Come back anytime you need help with products or recipes!",
            "Take care! It was great helping you today. See you next time you need shopping assistance!",
            "Bye! Don't forget - I'm always here when you need help finding products or cooking ideas. Have a wonderful day!",
            "See you later! Thanks for using SAM AI for your shopping needs. Happy shopping!",
        ]
        return random.choice(responses)

    # Handle thank you messages
    if is_thank_you(query):
        responses = [
            "You're very welcome! I'm always happy to help with your shopping needs. Is there anything else you'd like to find?",
            "My pleasure! That's what I'm here for. Do you need help with anything else today?",
            "Glad I could help! Feel free to ask me about any other products, recipes, or shopping questions.",
            "You're welcome! I'm here whenever you need shopping assistance. What else can I help you find?",
        ]
        return random.choice(responses)

    # For non-shopping queries, redirect to shopping assistance
    responses = [
        "That's interesting, but I'm specifically designed to help with shopping assistance! I can help you find products, suggest recipes, or recommend sustainable alternatives. What would you like to shop for today?",
        "I appreciate the conversation, but I'm focused on being your shopping assistant. I can help you search for products, find recipes, or discover eco-friendly options. How can I assist with your shopping needs?",
        "While I'd love to chat about everything, I'm specialized in shopping assistance! I can help you find items in our inventory, suggest recipes, or recommend sustainable products. What are you looking to buy or cook today?",
        "That's outside my expertise, but I'm great at helping with shopping! Whether you need specific products, recipe ideas, or sustainable alternatives, I'm your assistant. What can I help you find?",
    ]
    return random.choice(responses)


def is_personal_question(query):
    """Check if the query is a personal question about the AI."""
    personal_patterns = [
        r"\b(who are you|what are you|tell me about yourself|your name)\b",
        r"\b(how old are you|where are you from|what do you do)\b",
        r"\b(are you real|are you human|are you a robot|are you ai)\b",
        r"\b(what can you do|your capabilities|your features)\b",
        r"\b(help me|what help|assistance)\b",
    ]

    query_lower = query.lower()
    return any(re.search(pattern, query_lower) for pattern in personal_patterns)


def get_personal_response():
    """Generate response for personal questions."""
    responses = [
        "I'm SAM AI, your intelligent shopping assistant! I'm here to help you find products, discover recipes, and suggest sustainable alternatives. What can I help you shop for today?",
        "I'm SAM AI - think of me as your personal shopping companion. I can help you search our inventory, find recipe ideas, and recommend eco-friendly products. How can I assist you?",
        "I'm SAM AI, designed specifically to make your shopping experience better! I can help with product searches, recipe suggestions, and sustainable shopping choices. What are you looking for?",
        "I'm SAM AI, your dedicated shopping assistant. My specialty is helping customers like you find exactly what they need, whether it's products, recipes, or eco-friendly alternatives. What can I help you with?",
    ]
    return random.choice(responses)
