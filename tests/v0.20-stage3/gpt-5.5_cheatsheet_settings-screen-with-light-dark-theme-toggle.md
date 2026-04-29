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
    card: "#1F2937"
    # brand inherits from the light theme
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

shared:
  theme_mode = "system"

screen Settings, title: "Settings":
  layout vertical, padding: large, gap: medium:
    layout vertical, padding: medium, gap: small, background: card, rounded: medium, border: thin:
      label "Theme preview", style: heading.small
      label "Default text on card"
      label "Explicit text token on card", color: text

    label "Appearance", style: heading.small

    layout horizontal, padding: medium, gap: medium, rounded: medium, border: border_for("system"), color: color_for("system"), background: card, on tap: shared.theme_mode = "system":
      label marker_for("system"), color: color_for("system")
      layout vertical, gap: small:
        label "Follow system"
        label "Use the OS appearance setting", style: caption

    layout horizontal, padding: medium, gap: medium, rounded: medium, border: border_for("light"), color: color_for("light"), background: card, on tap: shared.theme_mode = "light":
      label marker_for("light"), color: color_for("light")
      layout vertical, gap: small:
        label "Light"
        label "Always use the light theme", style: caption

    layout horizontal, padding: medium, gap: medium, rounded: medium, border: border_for("dark"), color: color_for("dark"), background: card, on tap: shared.theme_mode = "dark":
      label marker_for("dark"), color: color_for("dark")
      layout vertical, gap: small:
        label "Dark"
        label "Always use the dark theme", style: caption

  border_for(mode):
    if shared.theme_mode is mode:
      return thick
    return thin

  color_for(mode):
    if shared.theme_mode is mode:
      return brand
    return subtle

  marker_for(mode):
    if shared.theme_mode is mode:
      return "●"
    return "○"
```

I used the preview card’s `layout` for `background: card` because `card` is a background-only colour token in Igni; labels can use `color: text`, but not `background:` directly. The radio selection uses both border width and colour (`thick` + `brand`) so the active state is visible without relying on only one visual cue.