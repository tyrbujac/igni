```igni
# Settings.igni

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
    card: "#1A1A24"
    # brand omitted → inherits "#80CBC4" from light

shared:
  theme_mode = "system"

screen Settings, title: "Settings":
  layout vertical, padding: large, gap: medium:

    # Preview card — shows current variant's `card` and `text` tokens
    layout vertical, padding: medium, rounded: medium, background: card, gap: small:
      label "Preview", style: heading.small
      label "This card uses the `card` background token."
      label "Text uses the active variant's `text` colour."

    divider

    label "Appearance", style: heading.small

    ThemeOption "Follow system", "system"
    ThemeOption "Light", "light"
    ThemeOption "Dark", "dark"

component ThemeOption(label_text, mode_value):
  layout horizontal, gap: medium, align: center, padding: medium, rounded: medium, border: width_for(mode_value), color: color_for(mode_value), on tap: shared.theme_mode = mode_value:
    icon icon_for(mode_value), color: color_for(mode_value)
    label label_text

  width_for(m):
    if shared.theme_mode is m:
      return thick
    return thin

  color_for(m):
    if shared.theme_mode is m:
      return brand
    return subtle

  icon_for(m):
    if shared.theme_mode is m:
      return "radio_checked"
    return "radio_unchecked"
```

### Choices made where two canonical shapes existed

1. **Radio group as a custom component (`ThemeOption`) vs. three inlined bordered layouts.** Picked the component. Three near-identical bordered rows with selection logic on each is exactly the duplication custom components solve, and it lets the selected-state pattern (per-axis `width_for` / `color_for` functions from the *Border* section) live in one place instead of three.

2. **Selection signalled via border (width + colour) vs. background fill.** Picked the border pattern, since the cheatsheet documents it as the canonical selected-state pattern under *Border*. Width *and* colour both shift on selection — either alone is ambiguous.

3. **Tap target on the whole row (`on tap:` on the layout) vs. a dedicated control.** Picked the whole-row tap. Bigger hit area, simpler markup, and `on tap:` on a layout is the documented form. The leading icon doubles as a visual radio indicator.

4. **`shared.theme_mode = mode_value` inline in `on tap:` vs. an `emit`-based component event.** Picked inline assignment. `shared.X` is the documented coupling marker and the assignment is a one-liner; routing through `emit selected mode_value` + a parent handler would add indirection without buying anything (no parent-side validation, no extra side effects).

5. **`shared.theme_mode` default of `"system"`.** Matches the cheatsheet's stated default.