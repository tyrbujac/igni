Here is the complete Igni app. It uses a list of objects to drive the UI, and applies `border:` and `rounded:` to the layouts without a `background:` property to create the outlined-only card effect.

```igni
screen Settings:
  options = [
    {title: "Notifications", desc: "Manage your push and email alerts"},
    {title: "Privacy", desc: "Control who can see your profile data"},
    {title: "Account", desc: "Update your password and linked devices"}
  ]

  layout vertical, padding: large, gap: medium:
    label "Settings", style: heading
    
    each item in options:
      # border and rounded create the outlined card shape; 
      # omitting 'background:' ensures it has no fill colour.
      layout vertical, padding: medium, border: thin, rounded: medium:
        label item.title, style: heading.small
        label item.desc, style: caption
```