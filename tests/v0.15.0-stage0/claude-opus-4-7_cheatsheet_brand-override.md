# Settings Screen

```igni
theme:
  color:
    brand: "#FF6B35"

shared:
  dark_mode = false
  notifications = true
  sound_on = true

screen Settings, title: "Settings":
  layout vertical, gap: medium, padding: large, max_width: phone:
    label "Preferences", style: heading

    layout vertical, gap: small, padding: medium, background: card, rounded: medium:
      toggle bind: shared.dark_mode, label: "Dark mode"
      divider
      toggle bind: shared.notifications, label: "Notifications"
      divider
      toggle bind: shared.sound_on, label: "Sound"

    layout vertical, fill: true

    button "Logout", color: brand, on tap: logout()

  logout():
    shared.dark_mode = false
    shared.notifications = true
    shared.sound_on = true
    navigate back
```

## How the colour reaches the button

1. **Theme declaration.** The top-level `theme:` block patches the built-in `brand` token, rebinding it to `#FF6B35`. Per the spec, `theme: color: <token>: "<hex>"` overrides a built-in token project-wide; omitted keys keep their defaults, so this is a surgical patch, not a replacement.

2. **Token reference, not literal.** On the button, `color: brand` references the token by name — the same unquoted identifier used everywhere else in the language (`color: green`, `background: card`). Inline hex like `color: "#FF6B35"` would be a parse-time error; the spec forces all colour decisions through `theme:` so they're traceable to one place.

3. **Resolution.** At render time, the `brand` identifier resolves through the theme table to `#FF6B35`, and the button paints with that fill. If the brand colour ever changes, only the one line in `theme:` moves — every `color: brand` and `background: brand` across the project picks up the new value automatically.