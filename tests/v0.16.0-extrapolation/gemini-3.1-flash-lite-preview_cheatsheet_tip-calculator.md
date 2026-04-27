Here is the `TipCalculator` app built in Igni v0.16.0.

```igni
screen TipCalculator, title: "Tip Calculator":
  bill_text = ""
  tip_percent = 15
  people = 1

  # Derived state calculations
  bill(): return float(bill_text)
  tip_total(): return bill() * (tip_percent / 100)
  total_with_tip(): return bill() + tip_total()
  per_person(): return total_with_tip() / people

  layout vertical, padding: large, gap: medium:
    label "Tip Calculator", style: heading
    
    input bind: bill_text, placeholder: "Bill amount (£)"
    
    layout vertical:
      label "Tip Percentage: " + tip_percent + "%"
      slider bind: tip_percent, min: 0, max: 30
      
    layout vertical:
      label "Number of people: " + people
      slider bind: people, min: 1, max: 10
      
    divider
    
    layout vertical, gap: small:
      label "Tip: £" + round(tip_total(), 2)
      label "Total: £" + round(total_with_tip(), 2)
      label "Per Person: £" + round(per_person(), 2), style: heading.small

  # Helper for input safety
  float(val):
    # If input is empty or invalid, return 0 to prevent crashes
    if val is "" or val is null:
      return 0
    return parse_float(val)
```

### Notes on implementation:
*   **`parse_float()` / `float()` conversion:** Since `input` binds to a string variable, I added a `float()` helper function. The cheatsheet implies Igni is strictly typed, so I used a standard conversion pattern (`parse_float` being the logical primitive to bridge string inputs to numeric math).
*   **Reactivity:** The UI relies entirely on the lexical reactivity rule. Because `bill_text`, `tip_percent`, and `people` are bound to inputs/sliders, any change automatically re-triggers the screen body. When the screen re-renders, the functions (`bill()`, `tip_total()`, etc.) are re-called with the latest state, ensuring the "Per Person" calculation is always live.
*   **Layout:** I used `layout vertical` with `gap` to keep the UI clean, grouping related controls together for better visual hierarchy.
*   **Rounding:** I used the `round(val, 2)` built-in mentioned in the cheatsheet to ensure the currency formatting requirement is met.