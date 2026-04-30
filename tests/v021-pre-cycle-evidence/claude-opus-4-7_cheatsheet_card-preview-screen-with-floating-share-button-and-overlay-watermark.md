```igni
screen CardPreview:
  layout stack, on tap: navigate back:
    image shared.picked_card.image, fill: true

    layout vertical, padding: large, gap: medium, fill: true:
      label shared.picked_card.title, style: heading, color: white
      label shared.picked_card.message, style: body, color: white

    if shared.preview_mode:
      layout stack, align: center, fill: true:
        label "PREVIEW", style: heading, color: subtle, rotation: 45

    layout stack, align: bottom_right, fill: true, padding: large:
      button "Share", shape: circle, color: brand, on tap: share_card()

  share_card():
    navigate to Send shared.picked_card
```