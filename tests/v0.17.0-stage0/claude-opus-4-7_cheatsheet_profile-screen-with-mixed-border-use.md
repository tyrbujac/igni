```igni
screen Profile:
  layout vertical, gap: large, padding: large, align: center:
    image "avatar.png", size: 120, round: true
    label "Tyr Skenderi", style: heading
    label "tyr@example.com", style: caption

    layout horizontal, gap: medium:
      layout vertical, padding: medium, rounded: medium, border: thin, on tap: edit():
        label "Edit"
      layout vertical, padding: medium, rounded: medium, border: thin, on tap: share():
        label "Share"
      layout vertical, padding: medium, rounded: medium, border: thin, on tap: sign_out():
        label "Sign Out"

  edit():
    print("edit")

  share():
    print("share")

  sign_out():
    print("sign out")
```