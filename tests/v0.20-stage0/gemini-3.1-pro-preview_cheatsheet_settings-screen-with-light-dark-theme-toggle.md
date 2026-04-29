Here is the complete `Settings.igni` app, implementing the v0.20 dark mode propagation, theme blocks, and reactive settings selections.

```igni
theme:
  color:
    brand: "#6366F1"
    surface: "#F8FAFC"
    text: "#0F172A"
    card: "#FFFFFF"
    subtle: "#CBD5E1"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0F172A"
    text: "#F8FAFC"
    card: "#1E293B"
    subtle: "#334155"
    # `brand` is omitted here — it auto-falls-back to "#6366F1" from the light variant
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

shared:
  theme_mode = "system"

screen Settings, title: "Settings":
  options = [
    {label: "Follow system", value: "system"},
    {label: "Light", value: "light"},
    {label: "Dark", value: "dark"}
  ]

  layout vertical, padding: large, gap: large:
    
    # Preview Card explicitly using `card` background
    layout vertical, padding: large, gap: small, background: card, rounded: medium:
      label "Theme Preview", style: heading.small
      label "Foreground text automatically adapts to the active variant."
      
    # Selection Group
    layout vertical, gap: small:
      label "Appearance", style: caption
      
      each opt in options:
        layout horizontal, padding: medium, rounded: medium, border: border_for(opt.value), color: color_for(opt.value), on tap: shared.theme_mode = opt.value:
          label opt.label

  # Screen-internal functions drive the selected-state styling
  border_for(mode):
    result = thin
    if shared.theme_mode is mode:
      result = thick
    return result

  color_for(mode):
    result = subtle
    if shared.theme_mode is mode:
      result = brand
    return result
```

### Design Decisions & Canonical Shapes

1. **Selection-state pattern vs. Custom Component**
   To build the radio-style choices, I used the *Selected-state pattern* detailed in the cheatsheet (iterating an `options` list and using `border_for()` / `color_for()` internal functions). 
   *Why:* While a `ThemeOption` component would also be valid, the helper-function pattern is the canonical shape when the visual permutation relies entirely on a single piece of shared state (`shared.theme_mode`). Assigning defaults and overriding them inside the function strictly follows Igni's statement-based conditionals.
2. **Semantic vs. Numeric Spacing Tokens**
   I chose the word tokens (`padding: large`, `gap: small`) instead of the new v0.20 numeric scale (`padding: spacing/6`, `gap: spacing/2`).
   *Why:* Both are equally valid surfaces mapping to the exact same pixels. Word tokens read much cleaner in a high-level UI composition like a Settings screen, whereas the numeric scale is best reserved for screens requiring ultra-precise translations from a dense Figma spec.
3. **Reactivity without Event Listeners**
   The `on tap:` handler does a direct reassignment (`shared.theme_mode = opt.value`). Because token references resolve dynamically through the active variant, this one assignment instantly evaluates the entire layout, swapping the `border_for` outputs and immediately snapping the app's `theme:` values to the dark or light dictionary. There's no `.update()` or `setState` boilerplate required.