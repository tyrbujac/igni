To build this, we define the payment methods in the screen body, maintain the `selected` state, and use helper functions to compute the dynamic styling tokens for the `border:` and `color:` properties of each row.

```igni
screen PaymentSelector:
  # State
  methods = ["Credit Card", "PayPal", "Bank Transfer"]
  selected = "Credit Card"

  layout vertical, padding: large, gap: medium:
    label "Select Payment Method", style: heading
    
    # Render the list
    each method in methods:
      layout horizontal, padding: medium, background: card, rounded: medium, \
             border: border_width(method), color: border_color(method), \
             on tap: selected = method:
        label method

  # Styling logic
  border_width(method):
    if method is selected:
      return thick
    return thin

  border_color(method):
    if method is selected:
      return brand
    return subtle
```

### Key implementation details:
*   **State:** The `selected` variable tracks the currently active string.
*   **Reactivity:** Because `selected` is updated on tap, the screen automatically re-evaluates. The `border_width` and `border_color` functions are called during every render, comparing the loop variable `method` to the updated `selected` state to return the correct tokens.
*   **Styling:** We use the layout's `border:` and `color:` properties. The helper functions return the pre-defined Igni tokens (`thick`, `thin`, `brand`, `subtle`) to satisfy the requirement that all styles originate from the theme.
*   **Composition:** `rounded: medium` and `background: card` are applied to the layout to ensure the selected state is visually distinct and consistent with a card-based design.