```igni
screen Profile:
  layout vertical, padding: large, gap: large, align: center:
    layout vertical, gap: small, align: center:
      image "avatar.png", size: 120, round: true
      label "Ava Patel", style: heading
      label "ava.patel@example.com", style: caption

    layout horizontal, gap: medium, align: center:
      layout vertical, rounded: medium, border: thin:
        button "Edit", on tap: print("Edit")

      layout vertical, rounded: medium, border: thin:
        button "Share", on tap: print("Share")

      layout vertical, rounded: medium, border: thin:
        button "Sign Out", color: danger, on tap: print("Sign Out")
```