# Settings.igni

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
    card: "#1C1C24"
    # `brand` not redeclared → inherits "#FF6B35" from light

shared persisted:
  theme_mode = "system"
  sender_name = ""

screen Settings, title: "Settings":
  draft_name = shared.sender_name

  layout vertical, padding: large, gap: large:
    label "Appearance", style: title
    layout vertical, gap: small:
      ThemeOption "system", "Follow system"
      ThemeOption "light", "Light"
      ThemeOption "dark", "Dark"

    label "Sender", style: title
    input bind: draft_name,
      placeholder: "Your name on sent cards",
      on change: shared.sender_name = draft_name

component ThemeOption(mode, label_text):
  bg = card
  if shared.theme_mode is mode:
    bg = brand

  layout horizontal,
    padding: medium,
    gap: medium,
    align: center,
    background: bg,
    rounded: medium,
    on tap: shared.theme_mode = mode:
    icon dot_for(mode), color: color_for(mode)
    label label_text, color: color_for(mode)

  dot_for(m):
    if shared.theme_mode is m:
      return "circle-filled"
    return "circle"

  color_for(m):
    if shared.theme_mode is m:
      return white
    return text
```

## Decision notes

**Two equally-canonical shapes I picked between:**

1. **Selected-state styling: derived `bg` variable vs. screen-internal `bg_for()` function.** The cheatsheet shows both patterns (the `if selected: bg = brand` shape under *Conditionals*, the `width_for()` / `color_for()` functions under *Border / Selected-state pattern*). For `bg`, I used the variable form because the component re-evaluates with each render and the conditional reads cleanly inline. For `dot_for` / `color_for`, I used functions because they're called twice each (icon + label, both following the same selection axis) — defining once and calling twice beats duplicating the conditional.

2. **`input` binding to `shared.sender_name`.** Per the cheatsheet's explicit `input` exception ("`input bind: shared.X` is rejected at parse time"), I bridged through `draft_name = shared.sender_name` plus `on change: shared.sender_name = draft_name`. The `toggle` / `slider` shortcut for direct `shared.X` binding doesn't apply to `input`.

**Why the radio-options-as-component:** Three near-identical option rows is exactly the case where extracting a component beats repeating layout blocks. `ThemeOption "system", "Follow system"` reads as a design spec; the selection logic lives in one place.

**Persistence:** Both `theme_mode` and `sender_name` go in `shared persisted:` since both are user preferences expected to survive app close (per the cheatsheet's "if the user expects to see this value after closing and reopening the app" heuristic). Defaults are JSON-literal (`"system"`, `""`) — no function calls, satisfying the persisted-block constraint.