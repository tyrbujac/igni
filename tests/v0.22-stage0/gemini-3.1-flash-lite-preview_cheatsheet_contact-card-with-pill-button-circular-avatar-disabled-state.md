```igni
component ContactCard(contact):
  is_followed = false

  layout vertical, padding: large, gap: medium, background: card, rounded: medium:
    # 1. Circular Avatar
    image contact.image, size: 80, rounded: full

    # 2. Name and Role
    layout vertical, gap: none, align: center:
      label contact.name, style: heading
      label contact.role, style: caption

    # 3. Button Row
    layout horizontal, gap: medium, align: center:
      # Follow button
      layout vertical, rounded: full, background: if is_followed: subtle else: brand:
        hover:
          cursor: if is_followed: not_allowed else: pointer
        button "Follow", color: white, on tap: is_followed = not is_followed
      
      # Message button
      button "Message", color: subtle, on tap: print("Message clicked")

screen Home:
  user = {
    name: "Tyr",
    role: "UI Engineer",
    image: "avatar.png"
  }

  layout vertical, padding: large, align: center:
    ContactCard user
```