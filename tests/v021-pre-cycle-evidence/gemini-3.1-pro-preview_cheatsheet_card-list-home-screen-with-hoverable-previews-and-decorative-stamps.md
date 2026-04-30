Here is the complete Igni source for the greeting card app's home screen. It leverages the proposed `hover:`, `layout stack:`, `layout horizontal, wrap: true`, and `rotation:` primitives while keeping the theme and shared state strictly separated.

```igni
theme:
  color:
    brand: "#E2725B"       # soft red accent
    cream: "#FAF9F6"       # warm cream background
    sage: "#9DC183"        # sage green highlight
    card: "#FFFFFF"        # pure white for un-hovered cards
  typography:
    heading: font: pacifico
  scaffold:
    background: cream

shared:
  cards = [
    {id: 1, title: "Birthday", image: "bday.jpg", is_new: true},
    {id: 2, title: "Thank You", image: "thanks.jpg", is_new: false},
    {id: 3, title: "Congrats", image: "congrats.jpg", is_new: true},
    {id: 4, title: "Get Well", image: "getwell.jpg", is_new: false},
    {id: 5, title: "Thinking of You", image: "thinking.jpg", is_new: false},
    {id: 6, title: "Anniversary", image: "anniv.jpg", is_new: true}
  ]

screen Home:
  layout vertical, padding: large, gap: large:
    label "Choose a Design", style: heading

    # wrap: true handles responsive multi-line flow on wide screens 
    # and automatically stacks vertically on narrow devices.
    layout horizontal, wrap: true, gap: large:
      each card in shared.cards:
        CardPreview card, on pick(target): pick_card(target)

  pick_card(target):
    navigate to Customiser target

component CardPreview(card):
  # Outer stack frames the card. The small padding creates a border-like 
  # gap that lights up with the brand colour when hovered.
  layout stack, align: top_right, padding: small, background: card, rounded: medium, on tap: emit pick card:
    hover:
      background: brand
      shadow: medium
      cursor: pointer

    # Inner stack centers the typography over the image background
    layout stack, align: center:
      image card.image, size: 200
      label card.title, style: heading, color: white

    # Conditionally render the rotated stamp in the top-right corner
    if card.is_new:
      label "NEW!", padding: small, background: sage, color: white, rotation: 90
```