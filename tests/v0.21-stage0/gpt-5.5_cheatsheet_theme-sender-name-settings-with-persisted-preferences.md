```igni
theme:
  color:
    brand: "#E76F51"
    surface: "#FFF8F2"
    text: "#1F1A17"
    card: "#FFFFFF"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#12100E"
    text: "#F7EFE8"
    card: "#1F1A17"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

shared persisted:
  theme_mode = "system"
  default_sender_name = ""

screen Settings, title: "Settings", background: surface:
  sender_name = shared.default_sender_name

  layout vertical, padding: large, gap: medium:
    label "Appearance", style: heading

    layout horizontal, padding: medium, gap: medium, rounded: medium, background: card, border: border_for("system"), color: color_for("system"), on tap: shared.theme_mode = "system":
      icon radio_icon_for("system"), color: color_for("system")
      layout vertical:
        label "Follow OS", style: title
        label "Use this device's light or dark setting", style: caption

    layout horizontal, padding: medium, gap: medium, rounded: medium, background: card, border: border_for("light"), color: color_for("light"), on tap: shared.theme_mode = "light":
      icon radio_icon_for("light"), color: color_for("light")
      layout vertical:
        label "Force light", style: title
        label "Always use the light theme", style: caption

    layout horizontal, padding: medium, gap: medium, rounded: medium, background: card, border: border_for("dark"), color: color_for("dark"), on tap: shared.theme_mode = "dark":
      icon radio_icon_for("dark"), color: color_for("dark")
      layout vertical:
        label "Force dark", style: title
        label "Always use the dark theme", style: caption

    divider

    label "Default sender", style: heading
    input bind: sender_name, placeholder: "Your name on sent cards", on change: shared.default_sender_name = sender_name

  border_for(mode):
    if shared.theme_mode is mode:
      return thick
    return thin

  color_for(mode):
    if shared.theme_mode is mode:
      return brand
    return subtle

  radio_icon_for(mode):
    if shared.theme_mode is mode:
      return "radio_button_checked"
    return "radio_button_unchecked"
```

Brief choices:

- `shared persisted:` is used for both `theme_mode` and `default_sender_name`, so both survive app restarts.
- The sender input uses a local `sender_name` bridge because `input bind: shared.X` is not allowed in Igni.
- The radio-style picker uses tappable bordered rows plus checked/unchecked icons; the active row is visibly selected by both border width and colour.