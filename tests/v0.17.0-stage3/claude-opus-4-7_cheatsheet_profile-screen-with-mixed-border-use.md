```igni
screen Profile:
  layout vertical, gap: medium, padding: large, align: center:
    image "avatar.png", size: 120, round: true
    label "Tyr Andersen", style: heading
    label "tyr@example.com", style: caption

    layout horizontal, gap: medium:
      layout vertical, rounded: medium, border: thin:
        button "Edit", on tap: edit()
      layout vertical, rounded: medium, border: thin:
        button "Share", on tap: share()
      layout vertical, rounded: medium, border: thin:
        button "Sign Out", color: danger, on tap: sign_out()

  edit():
    print("edit")

  share():
    print("share")

  sign_out():
    print("sign out")
```