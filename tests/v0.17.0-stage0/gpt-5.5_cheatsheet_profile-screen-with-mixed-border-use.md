```igni
screen Profile:
  layout vertical, padding: large, gap: large, align: center:
    layout vertical, gap: small, align: center:
      image "https://i.pravatar.cc/160?img=12", size: 120, round: true
      label "Avery Stone", style: heading, align: center
      label "avery.stone@example.com", style: caption, align: center

    layout horizontal, gap: medium, align: center:
      layout vertical, border: thin, rounded: medium:
        button "Edit", on tap: print("Edit")

      layout vertical, border: thin, rounded: medium:
        button "Share", on tap: print("Share")

      layout vertical, border: thin, rounded: medium:
        button "Sign Out", on tap: print("Sign Out")
```