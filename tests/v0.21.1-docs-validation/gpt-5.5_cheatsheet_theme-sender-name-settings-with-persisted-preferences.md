```igni
theme:
  color:
    brand: "#FF6B35"
    surface: "#FFF8F2"
    text: "#24140C"
    card: "#FFFFFF"
    subtle: "#D7C8BC"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#141014"
    text: "#FFF8F2"
    card: "#241B24"
    subtle: "#5A4C55"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

shared persisted:
  theme_mode = "system"
  sender_name = ""

component ThemeChoice(label_text, mode):
  layout horizontal, padding: medium, gap: medium, rounded: medium, background: card, border: width_for(mode), color: color_for(mode), on tap: emit select mode:
    icon icon_for(mode), color: color_for(mode)
    label label_text, color: text

  width_for(candidate):
    if shared.theme_mode is candidate:
      return thick
    return thin

  color_for(candidate):
    if shared.theme_mode is candidate:
      return brand
    return subtle

  icon_for(candidate):
    if shared.theme_mode is candidate:
      return "radio_button_checked"
    return "radio_button_unchecked"

screen Settings, title: "Settings":
  sender_draft = shared.sender_name

  layout vertical, padding: large, gap: medium:
    label "Appearance", style: title, color: text

    ThemeChoice "Follow OS", mode: "system", on select(choice): shared.theme_mode = choice
    ThemeChoice "Force light", mode: "light", on select(choice): shared.theme_mode = choice
    ThemeChoice "Force dark", mode: "dark", on select(choice): shared.theme_mode = choice

    divider

    label "Default sender", style: title, color: text
    input bind: sender_draft, placeholder: "Your name on sent cards", on change: shared.sender_name = sender_draft
```

I used `shared persisted:` for both `theme_mode` and `sender_name`, so both survive app restarts. The sender input uses a local `sender_draft` bridge because `input bind: shared.X` is rejected in Igni; `on change:` writes each user edit back to persisted shared state.

For the theme picker, I used a small `ThemeChoice` component rather than repeating three long bordered-layout rows inline. The selected state is visible through both a checked radio icon and the recommended border width/colour pattern.