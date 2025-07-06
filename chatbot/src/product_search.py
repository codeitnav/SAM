import pandas as pd
import difflib

inventory = pd.read_csv("../data/walmart_format(1).csv", encoding="utf-8-sig")
sustainable = pd.read_csv("../data/Sustainable_List.csv", encoding="utf-8-sig")


def search_inventory(product_name):
    lower_name = product_name.lower()
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
        # Fuzzy match suggestions
        names = inventory["name"].tolist()
        close = difflib.get_close_matches(product_name, names, n=5, cutoff=0.6)
        suggestions = inventory[inventory["name"].isin(close)]

    if suggestions.empty:
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
            f"{i}. {row['name']} ({row['availableQuantity']} units, {row['location']})"
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
