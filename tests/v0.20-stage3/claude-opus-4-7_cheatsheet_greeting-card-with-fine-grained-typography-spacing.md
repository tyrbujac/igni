# Card.igni

```igni
theme:
  color:
    surface_elevated: "#F5F5F5"
    text: "#0D0D14"
  scaffold:
    background: surface_elevated

theme dark:
  color:
    surface_elevated: "#1C1C24"
    text: "#F5F5F5"
  scaffold:
    background: surface_elevated

screen Card:
  layout vertical, padding: spacing/8:
    layout vertical, padding: medium, background: surface_elevated, rounded: medium:
      label "Happy Birthday, Ada", style: heading
      layout vertical, gap: spacing/3:
        label "Wishing you a wonderful year ahead — full of curiosity, code, and the occasional well-deserved cup of tea.", style: body, color: text
      layout vertical, gap: spacing/5:
        label "— Tyr", style: caption
```

## Token choices — why I reached for each

The spec says: **numeric `spacing/N` for specific pixel values; word tokens for semantic shorthand.** Three of the four spacings here pin to exact pixels from a design spec, so numeric wins on three out of four:

| Spacing | Value | Token chosen | Why |
|---|---|---|---|
| Outer padding | 32 px | `spacing/8` | No word-token alias for 32 px. Numeric is the only option. |
| Card internal padding | 16 px | `medium` | Both work (`medium` = `spacing/4`). Word token reads as "standard card padding" — semantic intent over pixel value. |
| Title → body gap | 12 px | `spacing/3` | No word-token alias for 12 px. Numeric is forced. |
| Body → sender gap | 20 px | `spacing/5` | No word-token alias for 20 px. Numeric is forced. |

So: **numeric for 12 / 20 / 32** (the spec calls these out specifically as common Figma-spec values lacking aliases), **word token for the 16 px card padding** (where "medium internal padding" reads more like design intent than `spacing/4` does).

## Two structural notes

**Why nested `layout vertical` blocks for spacing?** A single `layout vertical, gap: X` applies *one* gap value between *all* siblings. The card needs **two different gaps** (12 px above body, 20 px above sender), so each text element sits in its own `layout vertical` with the appropriate `gap:` controlling its top spacing relative to the previous block. Three-element-three-gap variants would need a different shape; here, grouping body and sender each into their own gapped container is the cleanest expression.

**Why `color: text` on body only?** `heading` and `caption` styles already resolve their colour through theme defaults (which pick up `theme: color: text:` automatically when defined). The body label gets an explicit `color: text` to make the dark-mode flip source-visible at the call site — it documents the intent rather than relying on the cascade. In a stricter codebase you'd drop the explicit `color:` and let all three labels inherit; I've left it explicit because the prompt called out body-text colour specifically.