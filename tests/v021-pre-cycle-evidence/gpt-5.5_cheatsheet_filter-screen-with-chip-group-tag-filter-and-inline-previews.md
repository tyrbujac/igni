```igni
component TagChip(tag, selected):
  chip_bg():
    if selected:
      return brand
    return subtle

  chip_color():
    if selected:
      return white
    return black

  layout vertical, padding: small, background: chip_bg(), rounded: full, on tap: emit toggle tag:
    label "#" + tag, style: caption, color: chip_color()


component CardPreview(design):
  layout horizontal, padding: medium, gap: medium, background: card, rounded: medium, border: thin, on tap: emit choose design:
    hover:
      border: thick
      background: subtle
      cursor: pointer

    image design.image, size: 80

    layout vertical, gap: small:
      label design.title, style: heading.small

      layout horizontal, wrap: true, gap: small:
        each tag in design.tags:
          label "#" + tag, style: caption, padding: small, background: subtle, rounded: full


screen FilterCards, title: "Filter":
  tags = ["birthday", "thank-you", "holiday", "get-well", "congrats", "sympathy", "generic"]
  selected_tags = []

  layout vertical, padding: large, gap: medium:
    label "Filter by occasion", style: heading

    layout horizontal, wrap: true, gap: small:
      each tag in tags:
        TagChip tag, selected: is_selected(tag), on toggle(t): toggle_tag(t)

    divider

    layout vertical, gap: medium:
      if filtered_cards() is empty:
        label "No cards match these filters"
      else:
        each design in filtered_cards():
          CardPreview design, on choose(card): navigate to Customiser card

  is_selected(tag):
    return tag is in selected_tags

  toggle_tag(tag):
    if tag is in selected_tags:
      selected_tags = without(selected_tags, tag)
    else:
      selected_tags = selected_tags + [tag]

  filtered_cards():
    return filter(shared.cards, design => matches_selection(design))

  matches_selection(design):
    matched = false

    if selected_tags is empty:
      matched = true
    else:
      each tag in design.tags:
        if tag is in selected_tags:
          matched = true

    return matched
```

Note: Igni’s current/proposed `hover:` block only supports property overrides, not hover-only children, so the source uses hover to visually expand/emphasise the preview. Showing `description` only while hovered would need a future hover-state rendering primitive or a card data shape/UI that always includes the description.