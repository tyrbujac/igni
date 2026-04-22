# Personal Profile Card

```igni
screen ProfileCard, background: teal:
  layout vertical, fill: true, align: center, gap: medium, padding: large:
    image "avatar.png", size: 140, round: true
    label "Joe Bloggs", style: heading
    label "IGNI DEVELOPER", style: caption
    divider
    layout horizontal, gap: small, align: center:
      icon "phone", color: white
      label "+44 7700 900123", style: body
    layout horizontal, gap: small, align: center:
      icon "email", color: white
      label "joe.bloggs@example.com", style: body
```

## Design decisions

**On the font-family requirement — the honest answer:** the Igni v0.11.6 spec as given does **not** expose a font-family primitive. The styling vocabulary for text is limited to:

- **Text style tokens:** `heading`, `heading.small`, `body`, `caption`
- **Colour tokens**
- **`align: center`** on labels

There is no `font:`, no `font_family:`, no custom typography property documented anywhere in the cheat sheet. Inventing one (e.g. `label "Joe Bloggs", font: "Pacifico"`) would violate the spec's core rule: *"One way to do everything. No aliases, no shortcuts, no alternatives."*

So I made the following mapping, treating the built-in style tokens as the closest available proxies for the typographic hierarchy the brief describes:

| Spec requirement | Igni token used | Rationale |
|---|---|---|
| "Joe Bloggs" — large, Pacifico, defining element | `style: heading` | The largest/most prominent text style available. |
| "IGNI DEVELOPER" — smaller, all-caps, Source Sans Pro | `style: caption` | Smaller, subordinate text style; the string is written in caps literally (`upper(...)` is a runtime builtin, not a render-time transform, and over-engineering a static string through it would be silly). |
| Contact rows — Source Sans Pro | `style: body` | The standard body-text token. |

**What a real implementation would need.** To actually satisfy the Pacifico / Source Sans Pro requirement, Igni would need either:

1. A theme-level font-family configuration (mapping `heading` → Pacifico, `body` → Source Sans Pro project-wide), or
2. A per-label `font:` property.

Neither exists in v0.11.6. A responsible answer is to flag that gap rather than fabricate syntax.

**Other decisions:**

- **`fill: true` on the inner layout** expands it to fill the screen, and `align: center` on a vertical layout centres children horizontally; the combination of `fill` + centred children achieves both-axis centring without a wrapper.
- **`background: teal`** on the screen itself — cleaner than wrapping in a filled layout.
- **`icon "phone"` / `icon "email"`** with `color: white` for contrast against teal. Icon names are treated as conventional (the spec shows `icon "play"` as a bare example without enumerating the icon set).
- **`divider`** used as-is — it's a standalone primitive per the *Showing things* table.