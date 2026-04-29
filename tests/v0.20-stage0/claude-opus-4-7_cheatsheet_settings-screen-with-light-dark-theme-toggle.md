```igni
# Settings.igni — full app

theme:
  color:
    brand: "#80CBC4"
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
    card: "#1C1C24"
    # brand omitted → inherits "#80CBC4" from light variant

shared:
  theme_mode = "system"

screen Settings, title: "Settings":
  layout vertical, padding: large, gap: medium:

    # Preview card — shows the active variant's `card` and `text` tokens
    layout vertical, padding: medium, gap: small, background: card, rounded: medium:
      label "Preview", style: heading.small
      label "This card uses the themed surface and text colours."

    divider

    label "Appearance", style: heading.small

    # Radio-style options — one tile per mode
    ThemeOption "Follow system", value: "system"
    ThemeOption "Light", value: "light"
    ThemeOption "Dark", value: "dark"

component ThemeOption(label_text, value):
  layout horizontal, padding: medium, gap: medium, align: center, rounded: medium, border: border_width(value), color: border_color(value), on tap: shared.theme_mode = value:
    icon icon_for(value), color: border_color(value)
    label label_text, fill: true
    if shared.theme_mode is value:
      icon "check", color: brand

  border_width(v):
    result = thin
    if shared.theme_mode is v:
      result = thick
    return result

  border_color(v):
    result = subtle
    if shared.theme_mode is v:
      result = brand
    return result

  icon_for(v):
    result = "circle"
    if v is "system":
      result = "phone"
    else if v is "light":
      result = "sun"
    else if v is "dark":
      result = "moon"
    return result
```

### Decisions where two shapes existed

**1. Radio-row as a component vs. inline-repeated layout.** I extracted `ThemeOption` because the same shape repeats three times and the selected-state pattern (border width + colour + trailing checkmark) is exactly the kind of selection-signalling the cheatsheet calls out — factoring it keeps the screen body readable and puts the selection logic in one place. The alternative — three near-identical inline `layout horizontal:` blocks — would have triplicated the `border_width` / `border_color` branching.

**2. Tap target on the whole row vs. a dedicated radio control.** Igni doesn't ship a radio primitive, and the cheatsheet's selected-state pattern signals through `border:` + `color:` on a tappable layout. I put `on tap:` on the row's `layout horizontal:` (so the entire tile is the hit target) and used a trailing checkmark icon as the "selected" affordance. The two-axis signal (border width *and* colour) follows the cheatsheet's "either alone is ambiguous" rule.

**3. `bind: shared.theme_mode` on a `dropdown` vs. tap-driven assignment.** A `dropdown` with three options would be one line, and the cheatsheet explicitly endorses `dropdown bind: shared.X` for shared state. I went with tap-driven assignment because the prompt asks for "three radio-button-style options" with a visibly-selected option — that's a tile group, not a dropdown. The reassignment (`shared.theme_mode = value`) is a plain assignment to shared state; per the cheatsheet's reactivity rule, reassignment from any handler triggers re-render of every screen reading theme tokens, so the preview card flips instantly.

**4. Helper functions live on the component, not the screen.** `border_width` / `border_color` / `icon_for` are screen-internal-style functions defined inside the `ThemeOption` component body — they close over the component's `value` argument and read `shared.theme_mode`. Defining them on the parent `Settings` screen would have required passing `value` through, and the cheatsheet's cross-screen rule doesn't apply within a single component.