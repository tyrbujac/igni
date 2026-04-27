```igni
screen Settings:
  cards = [
    {title: "Notifications", description: "Choose how you receive updates."},
    {title: "Privacy", description: "Control what information is shared."},
    {title: "Account", description: "Manage your profile and sign-in details."}
  ]

  layout vertical, gap: medium, padding: large:
    label "Settings", style: heading

    each card in cards:
      layout vertical, gap: small, padding: medium, rounded: medium, border: thin:
        label card.title, style: heading.small
        label card.description, style: caption
```