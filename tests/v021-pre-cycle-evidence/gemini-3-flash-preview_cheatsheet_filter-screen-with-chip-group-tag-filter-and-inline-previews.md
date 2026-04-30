```igni
screen Filter:
  selected_tags = []
  tags = ["birthday", "thank-you", "holiday", "get-well", "congrats", "sympathy", "generic"]

  layout vertical, gap: medium, padding: medium:
    label "Filter by Occasion", style: heading.small

    # Chip group that wraps to next line if it gets too long (v0.21+ wrap: true)
    layout horizontal, wrap: true, gap: small:
      each tag in tags:
        TagChip tag, is_active: tag is in selected_tags, on tap: toggle(tag)

    divider

    # Results list with transition for smooth filtering
    layout vertical, gap: medium, transition: fade:
      if filtered_cards() is empty:
        layout vertical, align: center, padding: large:
          icon "search", size: large, color: subtle
          label "No cards match these tags", color: subtle
      else:
        each card in filtered_cards():
          CardPreview card

  toggle(tag):
    if tag is in selected_tags:
      selected_tags = without(selected_tags, tag)
    else:
      selected_tags = selected_tags + [tag]

  # Logic: Show all if none selected, otherwise intersect
  filtered_cards():
    if selected_tags is empty:
      return shared.cards
    
    return filter(shared.cards, card => has_match(card))

  has_match(card):
    # Check if any tag in card.tags is in the selected_tags list
    matches = filter(card.tags, t => t is in selected_tags)
    return length(matches) > 0

component TagChip(tag, is_active):
  bg = subtle
  txt = black
  if is_active:
    bg = brand
    txt = white

  layout vertical, padding: small, background: bg, rounded: full, on tap: emit tap:
    label "#" + tag, color: txt

component CardPreview(card):
  # Card with v0.21+ hover properties
  layout vertical, padding: medium, background: card, rounded: medium, border: thin, gap: small, on tap: navigate to Customizer card:
    hover:
      background: subtle
      border: medium
      cursor: pointer
    
    layout horizontal, gap: medium:
      image card.image, size: 80, rounded: small
      
      layout vertical, fill: true, gap: spacing/1:
        label card.title, style: heading.small
        
        # Tags inside the card
        layout horizontal, wrap: true, gap: spacing/1:
          each tag in card.tags:
            label "#" + tag, style: caption, color: subtle

    # Extra detail: Description (The hover: block highlights the container)
    label card.description, style: caption, color: subtle

# Note: This implementation assumes shared.cards exists with the structure:
# { id: int, title: String, image: String, tags: [String], description: String }
```