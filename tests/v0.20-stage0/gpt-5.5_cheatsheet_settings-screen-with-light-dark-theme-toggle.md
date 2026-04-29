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
    # brand falls back to the light variant
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
      label "Default text colour"
      label "Explicit text token", color: text

    label "Theme", style: heading.small

    layout horizontal, padding: medium, gap: small, rounded: medium, border: border_for("system"), color: color_for("system"), on tap: shared.theme_mode = "system":
      label mark_for("system"), color: color_for("system")
      label "Follow system"

    layout horizontal, padding: medium, gap: small, rounded: medium, border: border_for("light"), color: color_for("light"), on tap: shared.theme_mode = "light":
      label mark_for("light"), color: color_for("light")
      label "Light"

    layout horizontal, padding: medium, gap: small, rounded: medium, border: border_for("dark"), color: color_for("dark"), on tap: shared.theme_mode = "dark":
      label mark_for("dark"), color: color_for("dark")
      label "Dark"

  border_for(mode):
    if shared.theme_mode is mode:
      return thick
    return thin

  color_for(mode):
    if shared.theme_mode is mode:
      return brand
    return subtle

  mark_for(mode):
    if shared.theme_mode is mode:
      return "●"
    return "○"
```

I used custom tappable layout rows for the radio options because Igni has no dedicated radio primitive, and the requirement asks for radio-button-style controls rather than a dropdown. The selected state is shown by both marker text and border styling.

`card` is background-only in Igni, so the preview applies `background: card` to the preview layout rather than trying to use `color: card` on a label. The second label explicitly uses the `text` colour token with `color: text`; the first label uses the default text colour.