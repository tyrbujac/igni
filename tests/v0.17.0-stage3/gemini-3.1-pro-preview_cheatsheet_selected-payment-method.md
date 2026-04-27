Here is the complete, single-screen Igni app implementing the selected-state pattern. 

Because this state only lives on one screen, we use a local `selected` variable instead of `shared`. The UI automatically re-evaluates and updates the borders whenever a tap reassigns the `selected` variable.

```igni
screen Checkout:
  methods = ["Credit Card", "PayPal", "Bank Transfer"]
  selected = "Credit Card"

  layout vertical, padding: large, gap: medium:
    label "Payment Method", style: heading
    
    each method in methods:
      layout horizontal, padding: medium, background: card, rounded: medium, border: width_for(method), color: color_for(method), on tap: selected = method:
        label method

  width_for(method):
    if method is selected:
      return thick
    return thin

  color_for(method):
    if method is selected:
      return brand
    return subtle
```

### How it works:
1. **Local State:** `selected = "Credit Card"` runs once when the screen opens. Reassigning it via `on tap: selected = method` triggers a re-render of the screen body.
2. **Derived Styling Functions:** Because top-level variables run once, we define functions (`width_for` and `color_for`) to compute the dynamic styles. When `selected` changes, the layout re-reads these functions to determine the new borders.
3. **Reference Equality:** Because our list is made of simple strings, the `is` check inside the functions (`method is selected`) evaluates correctly by structural primitive equality. 
4. **Border Composition:** `border:` applies the width token, while `color:` resolves the theme colour. Combined with `background: card` and `rounded: medium`, the methods look like distinct clickable cards.