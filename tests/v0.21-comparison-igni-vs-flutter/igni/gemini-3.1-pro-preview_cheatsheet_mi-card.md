```igni
screen IdentityCard, background: teal:
  layout vertical, align: center, gap: medium:
    image "avatar.png", size: 140, round: true
    label "Joe Bloggs", style: heading
    label "IGNI DEVELOPER", color: white

    layout horizontal, align: center, background: card, rounded: medium, padding: medium, gap: medium:
      icon "phone", color: teal
      label "+44 123 456 7890"

    layout horizontal, align: center, background: card, rounded: medium, padding: medium, gap: medium:
      icon "mail", color: teal
      label "joe@bloggs.dev"
```