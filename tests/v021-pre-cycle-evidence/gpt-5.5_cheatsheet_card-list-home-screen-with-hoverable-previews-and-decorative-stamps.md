```igni
theme:
  color:
    brand: "#D96B5F"          # soft red accent
    cream: "#FFF4E3"          # warm cream app background
    card_surface: "#FFE8D2"
    sage_green: "#8FAF8D"     # NEW! highlight
    ink: "#3A2A24"
  typography:
    heading: font: pacifico
    body: font: inter
  scaffold:
    background: cream
  appbar:
    background: cream
    foreground: ink

shared:
  card_designs = [
    {id: "birthday", title: "Birthday", image: "birthday.png", is_new: true},
    {id: "thank_you", title: "Thank You", image: "thank-you.png", is_new: false},
    {id: "congrats", title: "Congrats", image: "congrats.png", is_new: true},
    {id: "love", title: "Love You", image: "love.png", is_new: false},
    {id: "new_home", title: "New Home", image: "new-home.png", is_new: false},
    {id: "just_because", title: "Just Because", image: "just-because.png", is_new: true}
  ]

component CardPreview(design):
  layout stack, align: top_right, padding: small, background: card_surface, rounded: medium, on tap: emit pick design:
    hover:
      background: brand
      shadow: small
      cursor: pointer

    layout stack, align: center:
      image design.image, size: 180
      label design.title, style: heading.small, color: white, padding: small, background: brand, rounded: small

    if design.is_new:
      label "NEW!", style: caption, color: white, padding: small, background: sage_green, rounded: small, rotation: 90

screen Home, title: "Send a Card", background: cream:
  layout vertical, padding: large, gap: medium, align: center:
    layout vertical, max_width: desktop, gap: medium:
      label "Pick a card design", style: heading, color: ink
      label "Choose a preview to start customising your greeting.", color: ink

      layout horizontal, wrap: true, gap: medium:
        each design in shared.card_designs:
          CardPreview design, on pick(card): pick_card(card)

  pick_card(card):
    navigate to Customiser card
```