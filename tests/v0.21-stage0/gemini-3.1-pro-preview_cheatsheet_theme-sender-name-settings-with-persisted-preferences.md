Here is the complete `Settings.igni` app meeting all your requirements.

```igni
theme:
  color:
    brand: "#FF6B35"
    surface: "#F9FAFB"
    text: "#111827"
    card: "#FFFFFF"
    subtle: "#D1D5DB"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#111827"
    text: "#F9FAFB"
    card: "#1F2937"
    subtle: "#374151"
  # brand, scaffold, and appbar are deliberately omitted here:
  # they auto-fall-back to the light variant's structure, 
  # safely resolving surface/text through this dark palette.

shared persisted:
  theme_mode = "system"
  sender_name = ""

screen Settings, title: "Settings":
  # Bridge variable required for inputs connected to shared state
  draft_name = shared.sender_name

  layout vertical, padding: large, gap: large:
    
    layout vertical, gap: small:
      label "Sender Profile", style: title
      input bind: draft_name, placeholder: "Your name on sent cards", on change: shared.sender_name = draft_name

    layout vertical, gap: small:
      label "Appearance", style: title
      layout vertical, gap: medium:
        ThemeOption "System default", mode: "system"
        ThemeOption "Force light", mode: "light"
        ThemeOption "Force dark", mode: "dark"

component ThemeOption(label_text, mode):
  layout vertical, padding: medium, rounded: medium, border: width_for(mode), color: color_for(mode), on tap: shared.theme_mode = mode:
    label label_text

  width_for(m):
    if shared.theme_mode is m:
      return thick
    return thin

  color_for(m):
    if shared.theme_mode is m:
      return brand
    return subtle
```

### Design Decisions & Idioms Used

1. **The Component + Internal Functions Shape**: There are two canonical ways to handle dynamic styling like the active radio button. You could use conditional reassignment at the top of the block (`bw = thin \n if selected: bw = thick \n layout ..., border: bw:`), or you can use internal helper functions. I opted for **internal helper functions** (`width_for` / `color_for`) because it exactly executes the "Selected-state pattern" outlined in the cheatsheet, keeping the layout properties inline and declarative.
2. **Factoring `ThemeOption` into a Component**: I moved the radio-button layout into a custom component rather than leaving it in the screen body. Since layout properties must remain on a single physical line, writing `layout vertical, padding: medium, rounded: medium, border: ..., color: ..., on tap: ...` inside the screen three times would result in uncomfortably long lines. The component avoids this and additionally resets the nesting counter.
3. **The `input` Exception Bridge**: You'll notice `input bind:` points to a local `draft_name` variable rather than `shared.sender_name` directly, updating the shared state via `on change:`. This is the required exception for `input` primitives to maintain a stable identifier under the hood without crashing the parser.
4. **Theme Dark Auto-Fall-Back**: The `theme dark:` block omits `brand`, `scaffold`, and `appbar` keys. Because structural keys automatically inherit from the light mode but resolve their colours through the active variant's palette, the app correctly applies the dark mode surfaces without redundant boilerplate.