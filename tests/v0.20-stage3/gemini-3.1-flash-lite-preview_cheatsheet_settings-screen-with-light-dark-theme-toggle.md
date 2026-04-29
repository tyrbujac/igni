This `Settings.igni` implements the requested theme-switching functionality using Igni's reactive state and variant-aware token resolution.

```igni
theme:
  color:
    brand: "#FF6B35"
    surface: "#FFFFFF"
    text: "#1D1D1F"
    card: "#F5F5F5"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#1D1D1F"
    text: "#F5F5F5"
    card: "#2D2D2F"
    # brand inherits from light theme

shared:
  theme_mode = "system"

screen Settings, title: "Settings":
  layout vertical, padding: large, gap: large:
    # Preview Card
    layout vertical, padding: medium, background: card, rounded: medium, gap: small:
      label "Preview Card", color: text
      label "This card shows theme colours", style: caption

    # Radio-style options
    layout vertical, gap: small:
      label "Theme Mode"
      Option "System (Follow OS)", "system"
      Option "Light", "light"
      Option "Dark", "dark"

component Option(label_text, mode_value):
  # Border width and colour logic
  width = "thin"
  color = "subtle"
  if shared.theme_mode is mode_value:
    width = "thick"
    color = "brand"

  layout vertical, border: width, color: color, padding: medium, rounded: medium, on tap: shared.theme_mode = mode_value:
    label label_text

```

### Design Notes

1.  **Selection Logic:** I chose to implement the "radio" options as a custom `Option` component. This avoids repeating the same layout-and-border logic three times. Inside the component, I used a conditional reassignment pattern (`width = "thin" ... if selected: width = "thick"`) to satisfy the requirement that selection signals through both width and colour.
2.  **Variant Inheritance:** The `brand` token is defined only in the light theme. Per the spec, the dark variant automatically inherits it, ensuring the accent colour remains consistent regardless of the current mode.
3.  **Preview Card:** The preview card uses the `card` and `text` tokens directly. Because these tokens are declared in the `theme` blocks, they automatically resolve to the correct surface/text colours whenever `shared.theme_mode` is updated (or when the OS appearance changes while in "system" mode).
4.  **Composition:** I used the `Settings` screen as the main entry point for this example. The scaffold and appbar settings ensure the frame of the application (e.g., the title area) reacts to theme flips alongside the content within the `Settings` screen.