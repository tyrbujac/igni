Here is the complete app. It uses an `each` loop to render the options, local state to track the selection, and helper functions to dynamically return the correct border width and colour tokens based on the active selection.

```igni
screen Checkout:
  methods = ["Credit Card", "PayPal", "Bank Transfer"]
  selected = "Credit Card"

  layout vertical, padding: large, gap: medium:
    label "Payment Method", style: heading
    
    each method in methods:
      layout horizontal, padding: medium, background: card, rounded: medium,
        border: width_for(method), color: color_for(method),
        on tap: selected = method:
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

### Why this works in Igni:
* **Lexical Reactivity**: Tapping a row fires `on tap: selected = method`. Because `selected` is reassigned, the screen re-evaluates.
* **Dynamic Styling**: Because top-level conditionals only run once, derived styles need to be functions. During the re-render, `width_for()` and `color_for()` are called for each row, returning `thick`/`brand` for the newly selected method and `thin`/`subtle` for the others. 
* **String Equality**: Because `methods` is a list of strings, `method is selected` compares them structurally (by value), making selection matching safe and simple.