```igni
theme:
  color:
    brand: "#E57373"       # Soft red accent
    cream: "#FFFDF5"       # Warm cream background
    sage: "#ADC178"        # Sage green for "NEW!" highlight
    card_face: "#FFFFFF"
    overlay: "#00000044"   # Semi-transparent for title readability
  scaffold:
    background: cream
  appbar:
    background: cream
    foreground: brand

shared:
  designs = [
    {id: "1", title: "Birthday", image: "bday.png", is_new: true},
    {id: "2", title: "Thank You", image: "thanks.png", is_new: false},
    {id: "3", title: "Wedding", image: "wedding.png", is_new: true},
    {id: "4", title: "Thinking of You", image: "flowers.png", is_new: false},
    {id: "5", title: "New Home", image: "house.png", is_new: true},
    {id: "6", title: "Anniversary", image: "hearts.png", is_new: false}
  ]

screen Home, title: "Choose a Design":
  layout vertical, padding: large, gap: large, align: center:
    label "Pick a card to start customising", style: heading.small

    # Responsive grid: wraps on desktop/tablet, stacks vertically on narrow phone
    layout horizontal, wrap: true, gap: medium, align: center:
      each design in shared.designs:
        CardTile design

  pick_card(card):
    # Logic to navigate to customiser would go here
    print("User picked: " + card.title)

component CardTile(card):
  # Base container with hover effects and interaction
  layout stack, align: bottom_left, rounded: medium, background: card_face, on tap: pick_card(card):
    hover:
      shadow: medium
      background: brand  # Tints the card background toward brand on hover

    # The card preview image
    image card.image, size: 180, rounded: medium

    # Title overlay: hand-drawn style simulated via caption and padding
    layout vertical, padding: small, background: overlay, fill: true:
      label card.title, color: white, style: caption

    # "NEW!" Stamp in top-right
    if card.is_new:
      layout vertical, align: top_right, padding: small:
        label "NEW!", background: sage, color: white, padding: small, rounded: small, rotation: 90
```