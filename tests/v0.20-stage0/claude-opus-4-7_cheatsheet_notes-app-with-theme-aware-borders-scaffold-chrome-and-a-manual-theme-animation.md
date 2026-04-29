```igni
# Notes.igni

theme:
  color:
    brand: "#80CBC4"
    subtle: "#6B6B6B"
    subtle_border: "#CFCFCF"
    surface: "#FFFFFF"
    card: "#F5F5F5"
    text: "#0D0D14"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

theme dark:
  color:
    surface: "#0D0D14"
    card: "#1C1C24"
    text: "#F5F5F5"
    subtle: "#9A9A9A"
    # `brand` not redeclared — auto-falls-back to "#80CBC4"
    # `subtle_border` not redeclared — auto-falls-back to "#CFCFCF"
  scaffold:
    background: surface
  appbar:
    background: surface
    foreground: text

shared:
  theme_mode = "light"
  notes = [
    {title: "Groceries", body: "Milk, bread, coffee"},
    {title: "Meeting prep", body: "Review Q3 numbers, draft agenda"},
    {title: "Weekend", body: "Call Mum, fix bike, finish book"}
  ]

screen Notes, title: "My Notes":
  layout vertical, padding: large, gap: medium:
    button "Toggle theme", color: brand, on tap: toggle_theme()

    each note in shared.notes:
      layout vertical, padding: medium, gap: small, background: card, rounded: medium, border: thin, color: subtle_border:
        label note.title, style: heading.small
        label note.body, color: subtle

  toggle_theme():
    if shared.theme_mode is "dark":
      shared.theme_mode = "light"
    else:
      shared.theme_mode = "dark"
```

**Notes on the constraints:**

- **Auto-fall-back demonstrated.** `brand` and `subtle_border` are declared only in the light `theme:` block. The dark variant inherits both values per the v0.20 auto-fall-back rule. `subtle` *is* redeclared in dark because it genuinely needs a different value for legibility on a dark surface — that's the legitimate use of the dark block.
- **Active-variant resolution.** Each note's `border: thin, color: subtle_border` resolves through the active variant. Because `subtle_border` is the same in both variants (auto-fall-back), the border colour stays visually constant — but `color: subtle` on the body label flips with the variant, since `subtle` differs between light (`#6B6B6B`) and dark (`#9A9A9A`). The cards' `background: card` flips too (white-ish → dark-ish).
- **Scaffold/AppBar propagation.** `theme: scaffold: background: surface` and `theme: appbar: background: surface, foreground: text` are declared in both variants. When `shared.theme_mode` flips, the scaffold + AppBar chrome snap to the new variant's `surface`/`text` tokens — no per-screen background overrides needed.
- **Instant-snap accepted.** I deliberately did *not* wrap the screen body in `if shared.theme_mode is "dark":` + `transition: fade`. Per the cheatsheet, the canonical default is the instant snap, and the explicit-fade pattern is opt-in for cases that actually need it. A notes list does not.
- **Toggle without `"system"`.** `toggle_theme()` flips strictly between `"light"` and `"dark"` — if the user landed via OS appearance on `"system"`, the first tap puts them in `"dark"` (since `"system" is "dark"` is `false`), then alternates from there. That matches the constraint as written.