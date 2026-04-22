```igni
component MenuItem(name, price):
  layout horizontal, spread: true:
    label name
    label price

screen Menu, background: card:
  layout vertical, padding: large, gap: medium:
    label "The Copper Kettle", style: heading, align: center
    label "Seasonal British cooking since 2012", align: center
    divider

    label "Starters", style: heading.small
    MenuItem "Roast pumpkin soup", price: "£7.50"
    MenuItem "Chicken liver parfait", price: "£8.50"

    label "Mains", style: heading.small
    MenuItem "Beef Wellington", price: "£28.00"
    MenuItem "Pan-roasted halibut", price: "£24.00"
    MenuItem "Wild mushroom risotto", price: "£18.50"

    label "Desserts", style: heading.small
    MenuItem "Sticky toffee pudding", price: "£7.50"
    MenuItem "Eton Mess", price: "£6.50"
```

### How the Typography Constraint was Handled

Because I must use **only** the Igni v0.11.6 spec provided, I did not inject custom font properties like `font: "Merriweather"`. The spec has a strict "One way to do everything" rule and lacks inline font-family primitives, operating purely on semantic style tokens (`heading`, `heading.small`, `body`, `caption`). 

To handle your typography requirement in Igni's paradigm:
1. **Structural Mapping:** The code applies `style: heading` to the main title and `style: heading.small` to the section headers (which represents the **Merriweather** requirement). Everything else—the tagline and the dish rows—falls back to the default `body` style (which represents the **Lora** requirement).
2. **Compiler-Level Pairing:** In Igni's "UI-first, compiles to Flutter" architecture, this explicit font-family pairing is not declared in the `.igni` file. Instead, you configure the underlying Flutter compiler's theme engine to strictly map the `heading` tokens to Merriweather and the `body` tokens to Lora. 

This keeps the markup entirely semantic, adheres perfectly to the 4-level nesting limit, and respects the boundaries of the provided cheat sheet without hallucinating new syntax.