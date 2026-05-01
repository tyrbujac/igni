```igni
screen IdentityCard, background: teal:
  layout vertical, fill: true, align: center, gap: medium, padding: large:
    image "avatar.png", size: 140, round: true
    label "Joe Bloggs", style: heading, color: white
    label "IGNI DEVELOPER", color: white

    layout vertical, gap: medium:
      layout horizontal, gap: medium, align: center, padding: medium, background: card, rounded: medium:
        icon "phone", color: teal
        label "+44 123 456 7890"

      layout horizontal, gap: medium, align: center, padding: medium, background: card, rounded: medium:
        icon "mail", color: teal
        label "joe@bloggs.dev"
```