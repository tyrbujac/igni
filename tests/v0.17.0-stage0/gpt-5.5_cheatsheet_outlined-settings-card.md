```igni
screen Settings:
  settings = [
    {title: "Account", description: "Manage your profile and sign-in details."},
    {title: "Notifications", description: "Choose when the app sends you alerts."},
    {title: "Privacy", description: "Control visibility and data preferences."}
  ]

  layout vertical, padding: large, gap: medium:
    label "Settings", style: heading

    each setting in settings:
      layout vertical, padding: medium, rounded: medium, border: thin:
        label setting.title, style: heading.small
        label setting.description, style: caption
```