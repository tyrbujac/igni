# Card.igni

```igni
theme:
  color:
    text: "#0D0D14"
    surface_elevated: "#F5F5F5"
  scaffold:
    background: surface_elevated

theme dark:
  color:
    text: "#F5F5F5"
    surface_elevated: "#1A1A22"
  scaffold:
    background: surface_elevated

screen Card:
  layout vertical, padding: spacing/8, align: center:
    layout vertical, padding: spacing/4, background: surface_elevated, rounded: medium, max_width: phone:
      label "Happy Birthday", style: heading, color: text
      layout vertical, gap: spacing/3:
        label "Wishing you a wonderful day filled with joy, laughter, and all the things that make you smile. Here's to another year of adventures.", style: body, color: text
      layout vertical, gap: spacing/5:
        label "— With love, Tyr", style: caption, color: text
```

Wait — that's wrong. `gap:` controls space *between* siblings inside a layout, not space *above* a single child. Let me rebuild this correctly.

```igni
theme:
  color:
    text: "#0D0D14"
    surface_elevated: "#F5F5F5"
  scaffold:
    background: surface_elevated

theme dark:
  color:
    text: "#F5F5F5"
    surface_elevated: "#1A1A22"
  scaffold:
    background: surface_elevated

screen Card:
  layout vertical, padding: spacing/8, align: center:
    layout vertical, padding: spacing/4, background: surface_elevated, rounded: medium, max_width: phone:
      label "Happy Birthday", style: heading, color: text
      layout vertical, padding: spacing/3:
        label "Wishing you a wonderful day filled with joy, laughter, and all the things that make you smile. Here's to another year of adventures.", style: body, color: text
      layout vertical, padding: spacing/5:
        label "— With love, Tyr", style: caption, color: text
```

Hmm — that's also off. `padding:` adds space on *all four sides* of a layout, which would add 12 px below the title-block too, accumulating wrong. The right shape is: each text element is a sibling, and a non-uniform gap pattern (12 px between rows 1–2, 20 px between rows 2–3) means I can't use a single `gap:` on the parent.

The clean way: stack the title and body together in one `layout vertical, gap: spacing/3:` (giving the 12 px), then put that whole group plus the sender in an outer `layout vertical, gap: spacing/5:` (giving the 20 px).

## Final version

```igni
theme:
  color:
    text: "#0D0D14"
    surface_elevated: "#F5F5F5"
  scaffold:
    background: surface_elevated

theme dark:
  color:
    text: "#F5F5F5"
    surface_elevated: "#1A1A22"
  scaffold:
    background: surface_elevated

screen Card:
  layout vertical, padding: spacing/8, align: center:
    layout vertical, padding: spacing/4, background: surface_elevated, rounded: medium, max_width: phone, gap: spacing/5:
      layout vertical, gap: spacing/3:
        label "Happy Birthday", style: heading, color: text
        label "Wishing you a wonderful day filled with joy, laughter, and all the things that make you smile. Here's to another year of adventures.", style: body, color: text
      label "— With love, Tyr", style: caption, color: text
```

## How spacing maps to tokens

| Requirement | Token | Pixels |
|---|---|---|
| Outer padding around card | `spacing/8` | 32 px |
| Card internal padding | `spacing/4` (= `medium`) | 16 px |
| Title → body gap | `spacing/3` | 12 px |
| Body → sender gap | `spacing/5` | 20 px |
| Rounded corners | `medium` | (token) |

## Why numeric over word tokens here

I reached for the **numeric scale** (`spacing/N`) for this card. Two of the four spacing values — 12 px and 20 px — don't have word-token aliases at all (`small`/`medium`/`large` only cover 8/16/24). Mixing `padding: medium` with `gap: spacing/3` would force the reader to mentally translate two different vocabularies on adjacent lines to check whether the rhythm is intentional.

With everything on the numeric scale, the spacing pattern reads as a sequence: `8 → 4 → 3 → 5`, and the multiply-by-4 rule makes pixel translation from a Figma spec a single arithmetic step. Word tokens shine when the *semantics* are what matters ("medium gap between cards in a list"); numeric tokens shine when the *exact rhythm* is what matters, which is the case for tuned typography spacing.

## Layout structure note

The non-uniform gap (12 px in one place, 20 px in another) is built by nesting: the inner `layout vertical, gap: spacing/3:` groups the title and body as a typographic unit, and the outer `gap: spacing/5:` separates that unit from the sender. This matches how the design reads — title and body are one block of "card content," sender is the signature underneath — so the structure carries semantics, not just measurement.