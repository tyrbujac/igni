```igni
screen CardPreview:
  # Reference existing shared state
  card = shared.picked_card

  # Use a stack to layer the watermark and button over the content
  # Background image applied to the container; tapping background navigates back
  layout stack, background: card.image, fill: true, on tap: navigate back:

    # 1. Watermark Layer
    # Only shows if preview_mode is active. 
    # Using rotation: 90 (per whitelist) for the diagonal/vertical effect.
    if shared.preview_mode is true:
      layout vertical, align: center:
        label "PREVIEW", style: heading, color: white, rotation: 90

    # 2. Main Content Layer
    # Centered title and message
    layout vertical, align: center, gap: large, padding: large:
      label card.title, style: heading, color: white
      label card.message, style: body, color: white
      
      # Navigation to Send screen as mentioned in requirements
      button "Send", color: brand, on tap: navigate to SendScreen

    # 3. Floating Action Layer
    # Positioned specifically in the bottom-right corner
    layout vertical, align: bottom_right, padding: large:
      button "Share", shape: circle, color: brand, on tap: share_card()

  # Screen-internal functions
  share_card():
    # Logic for sharing would go here
    print("Sharing " + card.title)

screen SendScreen:
  layout vertical, align: center, padding: large:
    label "Card Sent!", style: heading
    button "Back to Home", on tap: navigate to Home
```