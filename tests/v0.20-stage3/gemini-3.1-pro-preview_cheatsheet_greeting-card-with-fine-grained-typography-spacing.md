Here is the complete `Card.igni` file, utilizing Igni's v0.20 theme variants and numeric spacing tokens.

```igni
theme:
  color:
    surface_elevated: "#FFFFFF"
    text: "#0D0D14"
  scaffold:
    background: surface_elevated

theme dark:
  color:
    surface_elevated: "#1C1C1E"
    text: "#F5F5F5"

screen CardPreview:
  card_title = "Happy Birthday!"
  card_body = "Wishing you the absolute best year yet. I hope it is filled with joy, laughter, and an unreasonable amount of cake."
  card_sender = "— Tyr"

  # Outer layout: 32 px padding (spacing/8)
  layout vertical, padding: spacing/8:
    
    # Inner card: elevated background, 16 px padding (spacing/4), 16 px rounding
    # 20 px gap (spacing/5) separates the top text group from the sender
    layout vertical, background: surface_elevated, padding: spacing/4, rounded: medium, gap: spacing/5:
      
      # Top text group: 12 px gap (spacing/3) between title and body
      layout vertical, gap: spacing/3:
        label card_title, style: heading, color: text
        label card_body, style: body, color: text
        
      # Sender line sits below the 20 px gap of the parent layout
      label card_sender, style: caption, color: text
```

### Why Numeric Tokens (`spacing/N`)?

I reached exclusively for the **numeric scale** (`spacing/3`, `spacing/5`, `spacing/8`) for the padding and gaps, with the single exception of `rounded: medium`. Here's why:

1. **Exact Pixel Targets Without Aliases:** The design called for 12 px, 20 px, and 32 px spacing. None of these align with the semantic word-tokens (`small`=8, `medium`=16, `large`=24). Falling back to `spacing/3`, `spacing/5`, and `spacing/8` was mandatory to hit the spec.
2. **Visual Consistency:** Once I had to use `spacing/N` for the 12/20/32 px constraints, I also used `spacing/4` for the 16 px internal padding rather than switching formats to `padding: medium`. Mixing numeric grid math (`gap: spacing/5`) and semantic words (`padding: medium`) on the same line makes the relative proportions harder to read at a glance. Keeping structural layout on the math scale keeps the 4px-grid multiplier obvious.
3. **Semantic Rounding:** I kept `rounded: medium` for the corner radius. Corner radii are typically perceived as semantic tiers ("soft", "pill", "sharp") rather than mathematical offsets, so `medium` signals design intent better there than `spacing/4`, even though they resolve to the exact same 16 pixels. 

### Implementation Details

- **Heterogeneous Gaps:** Because a `layout vertical` applies its `gap:` uniformly to all immediate children, you can't have a 12 px gap and a 20 px gap in a flat list. I solved this natively by grouping the title and body in their own `layout vertical, gap: spacing/3`, and letting the parent card layout handle the 20 px separation down to the sender. This hits exactly the max-nesting limit (Screen → Outer Layout → Card Layout → Text Group Layout = 4 levels).
- **Dark Mode:** By declaring `text` and `surface_elevated` in the `theme:` and `theme dark:` blocks, the `color: text` and `background: surface_elevated` properties automatically snap to `#F5F5F5` and `#1C1C1E` when the OS appearance or `shared.theme_mode` switches to dark. Hex codes are kept strictly in the theme blocks per the spec.