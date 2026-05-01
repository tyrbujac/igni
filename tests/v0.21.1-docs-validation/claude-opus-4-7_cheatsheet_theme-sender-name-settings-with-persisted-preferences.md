```igni
# Settings.igni — personal greeting-card-sender preferences

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
    # `brand` inherits "#FF6B35" from light variant
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

shared persisted:
  theme_mode = "system"
  sender_name = ""

screen Settings, title: "Settings":
  # Local bridge for the input — `input bind: shared.X` is parse-rejected,
  # so we mirror sender_name into a local and write back on change.
  draft_name = shared.sender_name

  layout vertical, padding: large, gap: large, max_width: phone:
    label "Appearance", style: title
    layout vertical, gap: small:
      ThemeOption "system", "Use system setting"
      ThemeOption "light", "Light"
      ThemeOption "dark",  "Dark"

    divider

    label "Sender", style: title
    label "This name pre-fills on every card you send.", style: caption
    input bind: draft_name,
      placeholder: "Your name on sent cards",
      on change: shared.sender_name = draft_name

component ThemeOption(mode_value, option_label):
  layout horizontal,
    padding: medium,
    gap: medium,
    align: center,
    background: bg_for(mode_value),
    rounded: medium,
    border: thin,
    color: border_color_for(mode_value),
    on tap: shared.theme_mode = mode_value:
      icon icon_for(mode_value),
        size: medium,
        color: icon_color_for(mode_value)
      label option_label

  bg_for(v):
    result = card
    if shared.theme_mode is v:
      result = brand
    return result

  border_color_for(v):
    result = subtle
    if shared.theme_mode is v:
      result = brand
    return result

  icon_for(v):
    result = "radio_unchecked"
    if shared.theme_mode is v:
      result = "radio_checked"
    return result

  icon_color_for(v):
    result = subtle
    if shared.theme_mode is v:
      result = white
    return result
```

### Choices made when two shapes were equally canonical

1. **Radio rows as a custom component (`ThemeOption`) rather than three inlined layouts.** Both work, but factoring deduplicates the selection-state styling logic and keeps the screen body scannable as a spec. The component takes `(mode_value, option_label)` and reads `shared.theme_mode` directly — selection state is global, not a parameter, so no `selected` flag is threaded through.

2. **Selection signalled through both background fill and border colour, with an icon swap.** Per the cheatsheet's "selection signals through both width and colour — either alone is ambiguous" rule. I used colour on both axes (border + background) plus an icon swap rather than width + colour, because the radio metaphor is the dominant visual cue here and a thicker border on the selected row reads less clearly than a filled background. Each axis is a screen-internal `*_for(v)` function so the layout line stays declarative.

3. **`shared persisted:` defaults are string literals (`"system"`, `""`) rather than `null` for `sender_name`.** An empty string lets `input bind: draft_name` mount with a stable initial value and avoids null-coalescing at the bridge site. `null` would also be valid but forces a defensive read elsewhere.

4. **Bridge pattern for `sender_name` uses `on change:` writing back on every keystroke.** The cheatsheet's `input bind: shared.X` exception leaves two shapes — write back per keystroke, or write back on a Save button. Per-keystroke matches a settings screen's "changes apply immediately" expectation; a Save button would imply transactional editing, which this UI doesn't promise.

5. **Three options listed in `system` → `light` → `dark` order.** Matches the cheatsheet's own enumeration of accepted values and puts the default first.