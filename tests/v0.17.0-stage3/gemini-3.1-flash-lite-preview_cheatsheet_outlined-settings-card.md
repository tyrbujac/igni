```igni
screen Settings:
  # Data structure for the settings
  items = [
    {title: "Notifications", desc: "Manage your alert preferences"},
    {title: "Privacy", desc: "Control your data visibility"},
    {title: "Account", desc: "Update your profile settings"}
  ]

  layout vertical, padding: large, gap: medium:
    label "Settings", style: heading
    
    # Iterate through the items
    each item in items:
      # Render each card
      layout vertical, padding: medium, rounded: medium, border: thin:
        label item.title, style: heading.small
        label item.desc, style: caption
```