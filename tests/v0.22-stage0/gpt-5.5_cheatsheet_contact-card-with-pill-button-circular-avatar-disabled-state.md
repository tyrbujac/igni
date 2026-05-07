```igni
screen ContactCard:
  followed = true

  layout vertical, padding: large, gap: large, align: center, max_width: phone, background: card, rounded: medium:
    layout vertical, rounded: full:
      image "https://images.unsplash.com/photo-1494790108377-be9c29b29330", size: 96, round: true

    layout vertical, gap: none, align: center:
      layout vertical, gap: small, align: center:
        label "Maya Chen", style: heading
        label "Senior Product Designer", style: caption

      layout horizontal, gap: small, align: center:
        if followed:
          layout horizontal, rounded: full, background: subtle:
            hover:
              background: subtle
              cursor: not_allowed
            button "Follow"
        else:
          layout horizontal, rounded: full, background: brand:
            hover:
              cursor: pointer
            button "Follow", on tap: followed = true

        button "Message", on tap: message()

  message():
    print("Opening message thread with Maya Chen")
```