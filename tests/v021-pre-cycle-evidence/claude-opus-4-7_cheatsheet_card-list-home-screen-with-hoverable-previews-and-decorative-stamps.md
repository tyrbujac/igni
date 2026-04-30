```igni
theme:
  color:
    brand: "#C97B5E"
    surface: "#FBF3E4"
    stamp: "#D14545"
    highlight: "#8FA876"
    card: "#FFFFFF"
    text: "#3D2E26"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text
  typography:
    heading: font: pacifico
    body: font: source_sans

shared:
  designs = [
    {id: 1, title: "Birthday",   image: "birthday.jpg",   is_new: true},
    {id: 2, title: "Thank You",  image: "thankyou.jpg",   is_new: false},
    {id: 3, title: "Congrats",   image: "congrats.jpg",   is_new: true},
    {id: 4, title: "Get Well",   image: "getwell.jpg",    is_new: false},
    {id: 5, title: "Anniversary",image: "anniversary.jpg",is_new: false},
    {id: 6, title: "Just Because", image: "justbecause.jpg", is_new: true},
  ]

screen Home, title: "Cards":
  layout vertical, padding: large, gap: medium:
    label "Pick a card", style: heading
    label "Tap a design to start customising", style: caption

    layout horizontal, wrap: true, gap: medium:
      each design in shared.designs:
        CardTile design, on tap: pick_card(design)

  pick_card(card):
    navigate to Customise card

component CardTile(design):
  layout stack, on tap: emit tap:
    layout vertical, background: card, rounded: medium, padding: small:
      hover:
        background: brand
        shadow: medium
        cursor: pointer
      image design.image, size: 200, rounded: small
      label design.title, style: heading.small, align: center

    if design.is_new:
      layout stack, align: top_right:
        label "NEW!", padding: small, background: highlight, color: white, rounded: small, rotation: 90
```

A few notes on the shape:

- **`theme:`** sets the warm cream `surface`, soft red `stamp`, and sage green `highlight`, plus a hand-drawn `pacifico` for headings (matching the "hand-drawn style" cue).
- **`shared:`** holds the six sample designs — `id`, `title`, `image`, `is_new`.
- **`layout horizontal, wrap: true`** gives the responsive wrapping grid: cards flow in a row and wrap to new lines on wide screens; on a narrow window they wrap down to a single column.
- **`hover:`** sub-block on the card layout produces the lift effect (brand-tinted background, shadow, pointer cursor) and is a no-op on touch-only platforms by design.
- **`layout stack, align: top_right`** places the "NEW!" stamp over the card's top-right corner, with `rotation: 90` for the rotated-label feel.
- **`CardTile`** is a component emitting `tap`, so `Home` wires `on tap: pick_card(design)` per design — the production rule about cross-screen function calls doesn't bite here (everything's in `Home`).