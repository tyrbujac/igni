```igni
screen CardPreview:
  layout stack, fill: true:

    # 1. Base Layer (Card Content)
    # Fills the screen, sets the image background, and handles background taps to exit.
    layout vertical, fill: true, padding: large, background: shared.picked_card.image, on tap: navigate back:
      label shared.picked_card.title, style: heading
      label shared.picked_card.message

    # 2. Watermark Layer (Centered Overlay)
    if shared.preview_mode is true:
      layout stack, fill: true, align: center:
        # Note [Honest-no candidate]: The prompt asks for "diagonal text", but Igni's 
        # rotation modifier strictly enforces a whitelist of 90/180/270. 
        # Free angles like `rotation: 45` are explicitly rejected at parse time.
        # We omit the rotation modifier and rely on the label itself to pass the compiler.
        label "PREVIEW", style: heading, color: subtle

    # 3. Action Layer (Floating Action Button)
    # The wrapper stack aligns the Share button to the bottom-right corner.
    layout stack, fill: true, align: bottom_right, padding: large:
      button "Share", shape: circle, color: brand, on tap: share_card()

  share_card():
    navigate to Send
```