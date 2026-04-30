```igni
screen Filter:
  selected_tags = []

  layout vertical, padding: large, gap: medium:
    label "Browse Designs", style: heading

    layout horizontal, wrap: true, gap: small:
      each tag in shared.all_tags:
        layout vertical, padding: small, rounded: full, background: chip_bg(tag), on tap: toggle_tag(tag):
          label "#" + tag, color: chip_color(tag)

    if visible_cards() is empty:
      layout vertical, fill: true, align: center, padding: large:
        label "No designs match these tags", style: caption
    else:
      each card in visible_cards():
        layout vertical, padding: medium, background: card, rounded: medium, gap: small, on tap: navigate to Customiser card:
          hover:
            background: subtle

          layout horizontal, gap: medium, align: center:
            image card.image, size: 64, round: false
            layout vertical, fill: true, gap: small:
              label card.title, style: heading.small
              layout horizontal, wrap: true, gap: small:
                each card_tag in card.tags:
                  badge "#" + card_tag, color: subtle

          if is_hovered(card):
            label card.description, style: caption

  toggle_tag(tag):
    if tag is in selected_tags:
      selected_tags = without(selected_tags, tag)
    else:
      selected_tags = selected_tags + [tag]

  chip_bg(tag):
    if tag is in selected_tags:
      return brand
    return subtle

  chip_color(tag):
    if tag is in selected_tags:
      return white
    return black

  visible_cards():
    if selected_tags is empty:
      return shared.cards
    return filter(shared.cards, card => has_overlap(card.tags))

  has_overlap(card_tags):
    overlap = false
    each t in card_tags:
      if t is in selected_tags:
        overlap = true
    return overlap

  is_hovered(card):
    return false
```

A few notes on the shape:

**Wrap on the chip row.** `layout horizontal, wrap: true` is the v0.21 candidate from the cheat sheet — the seven chips flow across, breaking to a new row when they run out of width, with `gap: small` applying both between siblings and between rows.

**Selection state via screen-internal helpers.** `chip_bg(tag)` and `chip_color(tag)` are functions (not top-level `=`) so they re-evaluate when `selected_tags` changes — same reactivity rule as `total()` in the cheat sheet's worked example. Toggling a chip reassigns `selected_tags`, the screen re-evaluates from the top, and every chip's background/foreground recomputes.

**Filter logic in `visible_cards()`.** Empty selection → all cards (early return). Otherwise filter by tag intersection. `has_overlap` walks the card's tags using the accumulator-at-top pattern (`overlap = false` declared first, mutated inside `each`) — list builtins don't include an `any`/`some`, so the explicit loop is the canonical shape.

**Hover honest-no.** The cheat sheet's `hover:` sub-block overrides layout properties (background, border, cursor) but explicitly doesn't accept primitives as children — so the "expand to show description" can't live inside `hover:` itself. I've used `hover:` for the visual lift (background flip) and left `is_hovered(card)` as a stub returning `false` — there's no language primitive in v0.20.1 to read per-element hover state into a conditional. On touch this is correctly a no-op (description never shows); on web/desktop the background-flip lift fires, but the description-on-hover requirement isn't fully expressible. Worth flagging rather than faking.

**Navigation on tap.** `on tap:` on the outer card layout navigates to `Customiser card`, satisfying the mobile path. Same handler fires on web — hover is for the visual hint only.

**Shape assumptions.** I'm reading `shared.all_tags` (the seven-tag list) and `shared.cards` from P1 — and assuming each card has a `description` field for the hover detail. If P1 only declared `id`/`title`/`image`/`tags`, add `description` to the card shape there.