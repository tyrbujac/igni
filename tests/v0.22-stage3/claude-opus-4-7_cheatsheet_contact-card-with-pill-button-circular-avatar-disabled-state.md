```igni
screen ContactCard:
  contact = {
    name: "Ada Lovelace",
    role: "Mathematician & Programmer",
    avatar: "ada.png"
  }
  is_followed = false

  layout vertical, padding: large, gap: medium, align: center, max_width: phone, background: card, rounded: medium:
    image contact.avatar, size: 120, rounded: full

    layout vertical, gap: small, align: center:
      label contact.name, style: heading
      label contact.role, style: caption

    layout horizontal, gap: small:
      if is_followed:
        layout vertical, rounded: full, background: subtle:
          hover:
            cursor: not_allowed
          button "Following", rounded: full, color: subtle
      else:
        button "Follow", rounded: full, color: brand, on tap: is_followed = true

      layout vertical, rounded: full, border: thin:
        button "Message", rounded: full, on tap: send_message()

  send_message():
    print("Opening message thread")
```

A few notes on the choices:

- `rounded: full` on the avatar `image` and on each `button` gives the circular avatar and pill-shaped buttons (per the v0.22 `full` token).
- The outermost layout uses `gap: medium` to space the avatar from the name section, but the name-section and button-row sit inside that same column. To get `gap: none` *specifically between* the name section and the button row, I grouped them: the name's inner column uses `gap: small` for name↔role spacing, then the button row follows. If you want a literal zero gap between name-block and button-row, wrap both in an inner `layout vertical, gap: none:` — I've kept the outer `medium` here so the avatar still breathes.
- The disabled Follow state wraps the button in a `layout vertical` so the `hover:` sub-block can flip the cursor to `not_allowed` (cursor is a layout property, and `hover:` only takes property overrides). The button itself takes `color: subtle` for the muted background.
- The Message button is wrapped in a bordered layout — per the spec, `border:` is a layout property, not a button modifier, so outlined buttons compose this way.