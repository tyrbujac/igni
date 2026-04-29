```igni
# Card.igni

theme:
  color:
    surface_elevated: "#F7F4EF"
    text: "#191712"
  scaffold:
    background: surface_elevated
  appbar:
    background: surface_elevated
    foreground: text

theme dark:
  color:
    surface_elevated: "#1E1B18"
    text: "#F6F1EA"
  scaffold:
    background: surface_elevated
  appbar:
    background: surface_elevated
    foreground: text

screen Card, title: "Greeting Card":
  layout vertical, padding: spacing/8, align: center:
    layout vertical, max_width: phone, padding: spacing/4, gap: spacing/5, background: surface_elevated, rounded: spacing/4:
      layout vertical, gap: spacing/3:
        label "For Your Brightest Day", style: heading, color: text
        label "May this little note find you smiling, rested, and surrounded by the kind of warmth you so often give to everyone else.", style: body, color: text
      label "— With love, Mara", style: caption, color: text
```

I used the numeric `spacing/N` scale because this card needs precise Figma-like spacing:

- `spacing/3` = 12 px between title and body.
- `spacing/5` = 20 px between body and sender.
- `spacing/8` = 32 px outer page padding.
- `spacing/4` = 16 px internal card padding and medium-equivalent corner rounding.

The nested inner layout is intentional: the title/body pair gets its own `gap: spacing/3`, while the card layout uses `gap: spacing/5` between that pair and the sender line. The `text` colour token is defined in both light and dark themes, so every label using `color: text` flips with the active theme variant.