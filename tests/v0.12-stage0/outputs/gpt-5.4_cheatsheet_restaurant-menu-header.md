```igni
screen Menu, title: "The Copper Kettle", background: card:
  layout vertical, padding: large, gap: medium:
    label "The Copper Kettle", style: heading, align: center, font: "Merriweather"
    label "Seasonal British cooking since 2012", align: center, font: "Lora"
    divider

    layout vertical, gap: small:
      label "Starters", style: heading.small, font: "Merriweather"
      layout horizontal, spread: true:
        label "Roast pumpkin soup", font: "Lora"
        label "£7.50", font: "Lora"
      layout horizontal, spread: true:
        label "Smoked mackerel pâté", font: "Lora"
        label "£8.50", font: "Lora"
      layout horizontal, spread: true:
        label "Beetroot and goat's cheese salad", font: "Lora"
        label "£9.00", font: "Lora"

    layout vertical, gap: small:
      label "Mains", style: heading.small, font: "Merriweather"
      layout horizontal, spread: true:
        label "Braised lamb shoulder", font: "Lora"
        label "£19.50", font: "Lora"
      layout horizontal, spread: true:
        label "Beer-battered haddock", font: "Lora"
        label "£17.00", font: "Lora"
      layout horizontal, spread: true:
        label "Wild mushroom risotto", font: "Lora"
        label "£16.50", font: "Lora"

    layout vertical, gap: small:
      label "Desserts", style: heading.small, font: "Merriweather"
      layout horizontal, spread: true:
        label "Sticky toffee pudding", font: "Lora"
        label "£8.00", font: "Lora"
      layout horizontal, spread: true:
        label "Lemon posset", font: "Lora"
        label "£7.50", font: "Lora"
      layout horizontal, spread: true:
        label "British cheese board", font: "Lora"
        label "£9.50", font: "Lora"
```

I handled the typography pairing by assigning:
- `font: "Merriweather"` to the restaurant name and all section headers
- `font: "Lora"` to the tagline, dish names, and prices

That keeps the editorial hierarchy clear: Merriweather anchors the structure, while Lora carries the menu content. I also kept Igni `style:` tokens like `heading` and `heading.small` for size/weight hierarchy, with font-family treated as an extra styling layer.