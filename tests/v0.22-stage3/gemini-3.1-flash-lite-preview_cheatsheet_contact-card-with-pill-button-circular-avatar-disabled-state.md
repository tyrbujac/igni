```igni
screen ContactProfile:
  contact = {
    name: "Tyr",
    role: "UI Engineer",
    image: "avatar.png",
    is_followed: false
  }

  layout vertical, padding: large, gap: medium, align: center:
    image contact.image, size: 100, round: full
    
    layout vertical, gap: none, align: center:
      label contact.name, style: heading
      label contact.role, style: caption

    layout horizontal, gap: medium:
      FollowButton contact.is_followed, on toggle: contact = {contact with is_followed: not contact.is_followed}
      button "Message", color: subtle, rounded: full

component FollowButton(is_followed):
  bg = brand
  if is_followed:
    bg = subtle

  layout vertical, rounded: full, background: bg:
    hover:
      if is_followed:
        cursor: not_allowed
      else:
        cursor: pointer
        background: blue
    
    button "Follow", on tap: emit toggle
```