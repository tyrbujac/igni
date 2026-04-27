```igni
screen Settings:
  items = [
    {title: "Account", desc: "Manage your account and profile details"},
    {title: "Notifications", desc: "Choose what alerts you receive"},
    {title: "Privacy", desc: "Control your data and visibility"}
  ]

  layout vertical, padding: large, gap: medium:
    label "Settings", style: heading
    
    each item in items:
      layout vertical, padding: medium, rounded: medium, border: thin:
        label item.title, style: heading.small
        label item.desc, style: caption
```