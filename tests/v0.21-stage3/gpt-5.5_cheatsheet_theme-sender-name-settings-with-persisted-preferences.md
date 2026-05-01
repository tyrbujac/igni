```igni
# Settings.igni

theme:
  color:
    brand: "#E85D75"
    surface: "#FFF8F4"
    text: "#24181A"
    card: "#FFFFFF"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#141012"
    text: "#FFF4F1"
    card: "#241A1D"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

shared persisted:
  theme_mode = "system"
  sender_name = ""

component ThemeModeOption(label_text, helper_text, value, selected_value):
  layout horizontal, spread: true, align: center, padding: medium, rounded: medium, border: border_for(value, selected_value), color: color_for(value, selected_value), background: card, on tap: emit select value:
    layout vertical, gap: spacing/1:
      label label_text
      label helper_text, style: caption, color: text
    if value is selected_value:
      icon "check_circle", color: brand
    else:
      icon "circle", color: subtle

  border_for(option, current):
    if option is current:
      return thick
    return thin

  color_for(option, current):
    if option is current:
      return brand
    return subtle

screen Settings, title: "Settings":
  sender_draft = shared.sender_name

  layout vertical, padding: large, gap: large:
    layout vertical, gap: small:
      label "Appearance", style: title
      label "Choose how this app follows your theme preference.", style: caption

      ThemeModeOption "Follow OS", helper_text: "Use your device appearance", value: "system", selected_value: shared.theme_mode, on select(mode): shared.theme_mode = mode
      ThemeModeOption "Force light", helper_text: "Always use the light theme", value: "light", selected_value: shared.theme_mode, on select(mode): shared.theme_mode = mode
      ThemeModeOption "Force dark", helper_text: "Always use the dark theme", value: "dark", selected_value: shared.theme_mode, on select(mode): shared.theme_mode = mode

    layout vertical, gap: small:
      label "Default sender", style: title
      input bind: sender_draft, placeholder: "Your name on sent cards", on change: shared.sender_name = sender_draft
```

Notes:

- `theme_mode` and `sender_name` are in `shared persisted:` so both survive app restarts.
- The sender input uses a local `sender_draft` bridge because `input bind: shared.sender_name` is not allowed in Igni; `on change:` writes the local value back to persisted shared state.
- I used a small `ThemeModeOption` component for the three radio-style rows to avoid repeating the same bordered-layout selection logic three times.