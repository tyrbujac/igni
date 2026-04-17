```ini
# --- Shared State Definition (Assumed Global Scope) ---
# Assume 'cart_items' is a globally accessible, mutable list of objects:
# [{product: String, quantity: Int, price: Float}]

# Initialize the cart state (conceptual setup)
# cart_items = [] 

# --- State Manipulation Function (Conceptual Binding) ---
# This function represents the global logic triggered when a product is selected.
# It must be defined externally but is called from the UI.
# on_add_to_cart(product_name, price):
#     for item in cart_items:
#         if item.product == product_name:
#             item.quantity += 1
#             return
#     cart_items.append({product: product_name, quantity: 1, price: price})
# ----------------------------------------------------------


# ============================================================
# 1. PRODUCT LIST SCREEN (Home/Catalog)
# ============================================================
# Shows all available products and handles adding them to the cart.

# Available Product List (Hardcoded for demonstration)
PRODUCT_CATALOG = [
    {name: "Coffee Beans", price: 15.99},
    {name: "Milk Frother", price: 35.50},
    {name: "Mug Set", price: 22.00}
]

ProductListScreen:
    title: "Our Products"
    content:
        # Header: Shopping Cart Count Placeholder
        CartStatus: 
            text: "Items in Cart: {len(cart_items)}"
            onTap: ViewCartScreen

        # Product Grid/List
        ScrollView:
            ProductCard(product: "Coffee Beans", price: 15.99)
            ProductCard(product: "Milk Frother", price: 35.50)
            ProductCard(product: "Mug Set", price: 22.00)

# Component Definition (Reusable Card)
ProductCard(product, price):
    layout: Row
    content:
        Label(text: "{product} - ${price:.2f}")
        Spacer()
        Button(text: "Add to Cart", 
              onTap: on_add_to_cart(product, price))


# ============================================================
# 2. CART SCREEN (Checkout View)
# ============================================================
# Displays cart contents and calculates the total.

CartScreen:
    title: "Your Shopping Cart"
    content:
        if not cart_items:
            Label(text: "Your cart is empty.")
        else:
            # List of items in the cart
            CartItemsList(items: cart_items)
            
            # Total summary section
            SummaryArea(cart_items: cart_items)

# Component Definition: Item Listing
CartItemsList(items):
    ScrollView:
        # Mapping over the cart_items list
        foreach item in items:
            CartItemRow(item=item)

CartItemRow(item):
    layout: Row
    content:
        Label(text: "{item.product}")
        Spacer()
        Label(text: "${item.quantity} x ${item.price:.2f}")
        Label(text: "${item.quantity * item.price:.2f}")

# Component Definition: Summary and Checkout
SummaryArea(cart_items):
    layout: Row
    content:
        Spacer()
        Label(text: "Total:")
        Label(text: "${sum(item.quantity * item.price for item in cart_items)}", style: Bold)
        
        Button(text: "Checkout", 
              onTap: show_success_message())

# ============================================================
# 3. UTILITY/SUCCESS VIEW (Confirmation)
# ============================================================

ViewCartScreen:
    title: "Shopping Cart"
    # Simply navigates to the cart state
    action: Show(CartScreen)

show_success_message():
    # Placeholder for checkout success action
    print("Order Placed Successfully!")
```