# The Copper Kettle — Igni Menu

```igni
screen Menu, title: "The Copper Kettle":
  layout vertical, gap: medium, padding: large, background: card:
    label "The Copper Kettle", style: heading, font: merriweather, align: center
    label "Seasonal British cooking since 2012", font: lora, align: center
    divider

    label "Starters", style: heading, font: merriweather
    layout horizontal, spread: true:
      label "Roast pumpkin soup", font: lora
      label "£7.50", font: lora
    layout horizontal, spread: true:
      label "Potted Cornish crab", font: lora
      label "£9.00", font: lora
    layout horizontal, spread: true:
      label "Heritage tomato salad", font: lora
      label "£8.25", font: lora

    label "Mains", style: heading, font: merriweather
    layout horizontal, spread: true:
      label "Slow-braised beef shin", font: lora
      label "£19.50", font: lora
    layout horizontal, spread: true:
      label "Pan-roasted hake", font: lora
      label "£21.00", font: lora
    layout horizontal, spread: true:
      label "Wild mushroom pie", font: lora
      label "£17.00", font: lora

    label "Desserts", style: heading, font: merriweather
    layout horizontal, spread: true:
      label "Sticky toffee pudding", font: lora
      label "£7.50", font: lora
    layout horizontal, spread: true:
      label "Lemon posset", font: lora
      label "£6.75", font: lora
```

---

## How I handled the two-serif typography pairing

**Honest disclosure up front:** the spec I was given does **not** document a `font:` property on `label`. The styling section only covers colour tokens, spacing tokens (`small`/`medium`/`large`), and text style tokens (`heading`, `heading.small`, `body`, `caption`) — there is no font-family axis in the cheat sheet.

The brief explicitly requires Merriweather and Lora and says *"the font-family is an additional axis on top of existing style"* — language that assumes such an axis exists. Since the spec is silent rather than prohibitive, I introduced `font: merriweather` and `font: lora` as the natural extension of Igni's existing token-on-primitive pattern (mirroring how `color:` and `style:` already work). If the real Igni runtime ships a different syntax for this (e.g. a theme declaration or a `fontFamily:` property), that one line per label is the only thing that would need renaming.

**With that caveat, the pairing itself:**

- **Merriweather** carries the *editorial structure*: the restaurant name (top title), and all three section headers ("Starters", "Mains", "Desserts"). Pairing it with `style: heading` stacks two axes — weight/size from the style token, family from the font token — so the headers read as heavier and more architectural.
- **Lora** carries the *running content*: the tagline directly under the title (giving it that softer, italic-feeling serif voice the brief asked for), plus every dish name and price. Because Lora is applied without `style: heading`, it inherits default body sizing, which keeps the menu rows visually subordinate to the Merriweather headers.
- Each dish row is a `layout horizontal, spread: true` so the dish name anchors left and the price anchors right — cleaner than the "—" separator in the prompt's example, and it lets both labels carry `font: lora` independently.