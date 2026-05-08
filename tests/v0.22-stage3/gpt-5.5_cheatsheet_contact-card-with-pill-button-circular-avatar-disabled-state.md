```igni
component Avatar(url):
  layout vertical, rounded: full:
    image url, size: 120

component ContactActions(followed):
  layout horizontal, gap: small, align: center:
    if followed:
      layout horizontal, padding: spacing/3, rounded: full, background: subtle:
        hover:
          background: subtle
          cursor: not_allowed
        label "Follow", color: white
    else:
      layout horizontal, padding: spacing/3, rounded: full, background: brand, on tap: emit follow:
        hover:
          cursor: pointer
        label "Follow", color: white

    layout horizontal, padding: spacing/3, rounded: full, border: thin, on tap: emit message:
      hover:
        cursor: pointer
      label "Message"

screen ContactCard:
  contact = {name: "Maya Chen", role: "Senior Product Designer", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
  followed = true

  layout vertical, padding: large, gap: medium, align: center, max_width: phone, background: card, rounded: medium:
    Avatar contact.avatar

    layout vertical, gap: none, align: center:
      layout vertical, gap: spacing/1, align: center:
        label contact.name, style: heading
        label contact.role, style: caption, color: subtle

      ContactActions followed, on follow: followed = true, on message: print("Opening message to " + contact.name)
```