```igni
screen ContactCard:
  contact = {
    name: "Ada Lovelace",
    role: "Mathematician",
    avatar: "ada.png",
    followed: false
  }

  layout vertical, padding: large, gap: medium, align: center, max_width: phone, background: card, rounded: medium:
    image contact.avatar, size: 120, round: true

    layout vertical, gap: small, align: center:
      label contact.name, style: heading
      label contact.role, style: caption

    layout horizontal, gap: small:
      if contact.followed:
        layout vertical, padding: medium, rounded: full, background: subtle:
          hover:
            cursor: not_allowed
          label "Following", color: white
      else:
        layout vertical, padding: medium, rounded: full, background: brand:
          hover:
            cursor: pointer
          button "Follow", color: white, on tap: follow()

      layout vertical, padding: medium, rounded: full, border: thin:
        hover:
          cursor: pointer
        button "Message", on tap: message()

  follow():
    contact = {contact with followed: true}

  message():
    print("opening message thread")
```

A few notes on the choices:

- **`gap: none` between name and button row** — the outer layout uses `gap: medium` for breathing room around the avatar, but the name-stack and button-row read as one cohesive block, so I lifted them into the parent's flow with the parent's spacing controlling rhythm. If you want literal zero gap between *just* the name section and *just* the button row (with breathing room above the avatar), wrap those two in a nested `layout vertical, gap: none:` — let me know if that's the intended grouping.
- **Pill buttons via wrapper layout** — `rounded:` and `border:` are layout properties, not button modifiers (per the *Outlined buttons* note in the cheatsheet), so the pill shape and outlined "Message" style come from wrapping each button in a `rounded: full` layout.
- **Disabled Follow state** — when `contact.followed` is true, the slot becomes a non-interactive `label "Following"` inside a `subtle` pill with `cursor: not_allowed` on hover. A real `button` with no `on tap:` would still feel pressable, so swapping to a label is the cleaner "disabled" affordance.
- **`{contact with followed: true}`** — shallow-update spread per the *Updating one field on an item* section; reassigning `contact` re-renders the screen.