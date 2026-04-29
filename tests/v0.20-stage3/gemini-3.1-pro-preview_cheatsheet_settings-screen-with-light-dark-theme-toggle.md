Here is the complete, valid Igni v0.20 application. 

```igni
theme:
  color:
    brand: "#FF6B35"
    surface: "#FFFFFF"
    text: "#0D0D14"
    card: "#F5F5F5"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"
    text: "#F5F5F5"
    card: "#1A1A24"
    # brand auto-falls-back to light variant; no need to declare
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

shared:
  theme_mode = "system"

screen Settings, title: "Settings":
  modes = [
    {label: "Follow system", val: "system"},
    {label: "Light", val: "light"},
    {label: "Dark", val: "dark"}
  ]

  layout vertical, padding: large, gap: large:
    
    # Theme Preview
    layout vertical, gap: small:
      label "Preview", style: heading.small
      layout vertical, padding: large, rounded: medium, background: card:
        label "This card uses the background: card surface."
        label "This text inherits the default text token."

    # Theme Selection
    layout vertical, gap: medium:
      label "Appearance", style: heading.small
      each mode in modes:
        layout horizontal, padding: medium, rounded: medium, border: border_for(mode.val), color: color_for(mode.val), on tap: shared.theme_mode = mode.val:
          label mode.label

  # Selected-state pattern functions
  border_for(val):
    width = thin
    if shared.theme_mode is val:
      width = thick
    return width

  color_for(val):
    c = subtle
    if shared.theme_mode is val:
      c = brand
    return c
```

### Idiomatic Choices Explained:

*   **List + `each` vs Hardcoded Siblings:** Since radio groups contain identical visual and behavioral logic per item, defining `modes = [...]` and using an `each` loop is the canonical choice. It avoids duplicating the layout definition and the `on tap:` handler logic three times.
*   **The `border_for` / `color_for` pattern:** As called out in the cheatsheet, selection UI needs both a width and color shift to be accessible. We use two screen-internal functions that evaluate the active mode, assign a default token, override it if selected, and return it. This keeps the layout declaration completely declarative and readable.
*   **Theme auto-fallback:** We deliberately omit `brand` from the `theme dark:` block. Igni automatically falls back to the light variant's token when a dark override isn't provided, which keeps theme definitions DRY.
*   **Reactivity:** Reassigning `shared.theme_mode = mode.val` in the `on tap:` handler automatically triggers a re-render of this screen, and because the platform resolves all `theme:` tokens through this built-in shared string, the entire app's chrome and active variant seamlessly flips instantly.