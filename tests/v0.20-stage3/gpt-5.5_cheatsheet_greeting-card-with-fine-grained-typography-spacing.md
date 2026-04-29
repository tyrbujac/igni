```igni
# Card.igni

theme:
  color:
    surface: "#FFFFFF"
    surface_elevated: "#F5F5F5"
    text: "#0D0D14"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"
    surface_elevated: "#1A1A22"
    text: "#F5F5F5"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

screen Card:
  layout vertical, padding: spacing/8, align: center:
    layout vertical, max_width: phone, padding: spacing/4, gap: spacing/3, background: surface_elevated, rounded: medium:
      label "For Your Next Adventure", style: heading, color: text

      layout vertical, gap: spacing/5:
        label "May the road rise gently, the coffee stay warm, and every small detour turn into a story worth telling.", style: body, color: text
        label "— With love, Mira", style: caption, color: text
```

I used the numeric `spacing/N` scale for the tuned layout values because this card is clearly matching specific pixel targets:

- `spacing/8` = 32 px outer screen padding
- `spacing/4` = 16 px internal card padding
- `spacing/3` = 12 px between title and body
- `spacing/5` = 20 px between body and sender

The word token `medium` is used for `rounded:` because the requirement calls it “medium rounding,” and in Igni `medium` maps to 16 px there. The `text` colour token is defined in both light and dark theme variants, so `color: text` flips automatically with dark mode.