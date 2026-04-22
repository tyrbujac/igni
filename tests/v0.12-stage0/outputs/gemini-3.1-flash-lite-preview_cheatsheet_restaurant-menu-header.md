```igni
screen Menu, background: card:
  layout vertical, padding: large, gap: medium:
    # Editorial Header
    label "The Copper Kettle", style: heading, align: center, font: "Merriweather"
    label "Seasonal British cooking since 2012", align: center, font: "Lora", style: caption
    
    divider
    
    # Menu Sections
    layout vertical, gap: small:
      label "Starters", style: heading.small, font: "Merriweather"
      Dish "Roast pumpkin soup", "£7.50"
      Dish "Smoked salmon pâté", "£9.00"

    layout vertical, gap: small:
      label "Mains", style: heading.small, font: "Merriweather"
      Dish "Braised ox cheek", "£18.50"
      Dish "Wild mushroom risotto", "£16.00"

    layout vertical, gap: small:
      label "Desserts", style: heading.small, font: "Merriweather"
      Dish "Sticky toffee pudding", "£8.00"
      Dish "Apple crumble", "£7.50"

component Dish(name, price):
  layout horizontal, spread: true:
    label name, font: "Lora"
    label price, font: "Lora"
```

### Typography Handling
To achieve the requested visual identity, I utilized Igni’s `font:` property, which allows for explicit override of the typeface family on any `label`.

1.  **Editorial Hierarchy:** I paired the `style: heading` / `style: heading.small` tokens (which handle sizing and weight) with the `"Merriweather"` font family to create a high-contrast, professional typographic anchor for the restaurant name and section headers.
2.  **Supporting Body:** The items and tagline use the `"Lora"` font. By wrapping the dish name and price in a reusable `Dish` component, I ensured that every menu item row consistently applies the Lora typeface without redundant code.
3.  **Layout & Contrast:** By placing the editorial header inside a `layout vertical` with `align: center` and using the `card` background token, the menu achieves the requested "Cream/light" aesthetic while maintaining a clear separation between the serif-heavy typography and the structural layout.