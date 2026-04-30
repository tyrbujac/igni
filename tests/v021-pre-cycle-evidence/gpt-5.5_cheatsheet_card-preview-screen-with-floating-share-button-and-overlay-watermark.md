```igni
screen CardPreview:
  layout stack, fill: true:
    layout vertical, fill: true, padding: large, gap: medium, background: shared.picked_card.image, on tap: navigate back:
      label shared.picked_card.title, style: heading, color: white
      label shared.picked_card.message, style: body, color: white
      layout vertical, fill: true
      button "Send", color: brand, on tap: send()

    if shared.preview_mode:
      layout vertical, fill: true, align: center:
        label "PREVIEW", style: heading, color: subtle, rotation: 90

    layout vertical, fill: true, padding: large:
      layout vertical, fill: true
      layout horizontal:
        layout horizontal, fill: true
        button "Share", shape: circle, color: brand, on tap: share_card()

  send():
    shared.preview_mode = false
    navigate to Send

  share_card():
    print(shared.picked_card.title)
```

Note: Igni’s current `rotation:` whitelist does not support true diagonal/free-angle text like `45°`; `rotation: 90` is the closest valid built-in transform.