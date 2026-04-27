```igni
screen Profile:
  user = {
    name: "Alex Rivera",
    email: "alex@example.com",
    avatar: "avatar.png"
  }

  layout vertical, padding: large, align: center:
    # Top block: Avatar, Name, Email
    image user.avatar, size: 80, round: true
    label user.name, style: heading
    label user.email, style: caption

    # Spacer
    layout vertical, fill: true

    # Action buttons: Row with thin borders
    layout horizontal, gap: medium:
      layout vertical, rounded: medium, border: thin:
        button "Edit", on tap: print("Edit")
      
      layout vertical, rounded: medium, border: thin:
        button "Share", on tap: print("Share")
        
      layout vertical, rounded: medium, border: thin:
        button "Sign Out", on tap: print("Sign Out")
```