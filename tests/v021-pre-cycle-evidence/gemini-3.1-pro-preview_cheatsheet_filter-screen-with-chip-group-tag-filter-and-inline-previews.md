```igni
# Igni v0.20.1

screen FilterCards:
  all_tags = ["birthday", "thank-you", "holiday", "get-well", "congrats", "sympathy", "generic"]
  selected_tags = []

  toggle_tag(tag):
    if tag is in selected_tags:
      selected_tags = without(selected_tags, tag)
    else:
      selected_tags = selected_tags + [tag]

  has_intersection(card):
    each ct in card.tags:
      if ct is in selected_tags:
        return true
    return false

  filtered_cards():
    if selected_tags is empty:
      return shared.cards
    return filter(shared.cards, c => has_intersection(c))

  layout vertical, fill: true, background: scaffold:
    
    # Chip group flowing horizontally and wrapping to new lines
    layout horizontal, wrap: true, gap: small, padding: medium:
      each tag in all_tags:
        FilterChip tag, is_selected: tag is in selected_tags, on toggle(t): toggle_tag(t)
    
    divider

    # Filtered results list
    layout vertical, fill: true, padding: medium, gap: medium:
      if filtered_cards() is empty:
        layout vertical, align: center, padding: large:
          label "No cards match the selected tags", color: