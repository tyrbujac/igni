Here is the complete `Settings.igni` app demonstrating durable state, theme variants, and the component-based selected-state pattern.

```igni
theme:
  color:
    brand: "#80CBC4"
    surface: "#FFFFFF"
    text: "#0D0D14"
    card: "#F5F5F5"
    subtle: "#E0E0E0"          # Explicit unselected border colour
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"         # Overrides light surface
    text: "#F5F5F5"            # Overrides light text
    card: "#1E1E1E"            # Overrides light card
    subtle: "#333333"          # Overrides light border
    # `brand` is omitted — automatically inherits "#80CBC4" from light

shared persisted:
  theme_mode = "system"        # Durable theme override (system/light/dark)
  sender_name = ""             # Durable user preference

screen Settings, title: "Settings":
  # Bridge local draft to shared state (input binding rule)
  draft_name = shared.sender_name

  layout vertical, padding: large, gap: large:
    
    # Sender Name Section
    layout vertical, gap: small:
      label "Default Sender Name", style: title
      input bind: draft_name, placeholder: "Your name on sent cards", on change: shared.sender_name = draft_name

    # Theme Mode Section
    layout vertical, gap: medium:
      label "Appearance", style: title
      
      layout horizontal, gap: medium:
        ThemeOption "System", mode: "system"
        ThemeOption "Light", mode: "light"
        ThemeOption "Dark", mode: "dark"

# Custom component representing a single radio-style selectable tile
component ThemeOption(label_text, mode):
  # Selected-state pattern: assign default tokens, override if active
  b_width = thin
  b_color = subtle
  
  if shared.theme_mode is mode:
    b_width = thick
    b_color = brand

  layout vertical, padding: medium, rounded: medium, border: b_width, color: b_color, align: center, fill: true, on tap: shared.theme_mode = mode:
    label label_text
```

### Design Decisions & Idiomatic Shapes

1. **`shared persisted:` for preferences:** Both `theme_mode` and `sender_name` use literal default values and are declared in the `shared persisted:` block. This guarantees they survive app restarts. Reassigning them later automatically writes the new value to disk and triggers reactive re-renders across the app.
2. **The `input bind:` workaround:** Because `input bind: shared.X` is rejected at parse time (due to Flutter `TextEditingController` identifier stability needs), the input binds to a local `draft_name` variable. The `on change:` handler syncs it back to the shared durable state on every keystroke. 
3. **Selectable Option Component (`ThemeOption`):** Instead of repeating the border-logic three times, it's extracted into a custom component. The component accepts the mode it represents (`"system"`, `"light"`, or `"dark"`). The `fill: true` on the component's root layout ensures all three options share the horizontal width equally.
4. **The "Selected-state" pattern:** Per the Igni styling docs, selection is signalled through both `border:` width and colour. The `ThemeOption` component resolves `b_width` and `b_color` reactively — checking if its `mode` matches `shared.theme_mode` — so tapping the layout instantly updates `shared` and triggers a re-render of all tiles to display the correct active state.
5. **Dark Mode Auto-fallback:** The `theme dark:` block intentionally omits the `brand` colour. It automatically inherits the `#80CBC4` value from the `theme:` block, meaning you only declare colours in dark mode if they actually need to change (unlike Tailwind/Compose where full duplication is required).