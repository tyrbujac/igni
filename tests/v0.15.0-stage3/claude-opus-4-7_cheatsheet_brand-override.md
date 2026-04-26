# Settings Screen with Custom Brand Colour

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
      toggle bind: shared.sound_on, label: "Sound effects"

    layout vertical, fill: true

    button "Logout", color: brand, on tap: logout()

  logout():
    shared.dark_mode = false
    shared.notifications = true
    shared.sound_on = true
    navigate to Login
```

## How the colour reaches the button

1. **Declaration in `theme:`.** The top-level `theme:` block declares `color: brand: "#FF6B35"`. Per the spec, this is a *patch* of the built-in token table — `brand` already exists as a default colour token, and this entry overrides it project-wide. Omitted keys keep their defaults.

2. **Reference by name.** On the button, `color: brand` refers to the token by its unquoted name. The spec requires this indirection: inline hex codes outside `theme:` are a parse-time error (`color: "#FF6B35"` would be rejected), so every colour decision is traceable to the theme block.

3. **Resolution at render.** When the transpiler emits Flutter, `brand` resolves through the patched token table to `#FF6B35`, and the button paints with that colour. Anywhere else `brand` appears (badges, icons, other buttons) picks up the same value — change the hex once in `theme:` and every site updates.