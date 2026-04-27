```igni
screen Profile:
  layout vertical, padding: large, align: center, gap: large:
    
    # Top section: Avatar, name, and email (no outline)
    layout vertical, align: center, gap: medium:
      image "avatar.png", size: 100, round: true
      label "Alex Harper", style: heading
      label "alex.harper@example.com", style: caption

    # Bottom section: Three labelled action buttons in a row
    layout horizontal, gap: medium, align: center:
      
      # Per the Igni rule: button outlines are achieved by wrapping 
      # the button in a layout with `border:` and `rounded:`
      layout vertical, rounded: medium, border: thin:
        button "Edit", on tap: edit()

      layout vertical, rounded: medium, border: thin:
        button "Share", on tap: share()

      layout vertical, rounded: medium, border: thin:
        button "Sign Out", on tap: sign_out()

  edit():
    print("Edit tapped")

  share():
    print("Share tapped")

  sign_out():
    print("Sign Out tapped")
```