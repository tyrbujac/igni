Here is the complete single-screen app. 

Since the `button` primitive doesn't natively take a `border:` property in Igni, the canonical way to create an outlined button is to use a tappable `layout` with `border: thin` (as shown in the spec's selection-state pattern). We wrap this into an `OutlinedButton` component to keep the code clean and strictly respect the 4-level nesting depth limit.

```igni
# A custom component that builds an outlined, tappable layout to act as a button
component OutlinedButton(text):
  layout vertical, padding: medium, rounded: medium, border: thin, align: center, on tap: emit tap:
    label text

screen Profile:
  user_name = "Ada Lovelace"
  user_email = "ada.lovelace@example.com"
  avatar_url = "https://example.com/avatar.jpg"

  layout vertical, padding: large, gap: large, align: center:
    
    # Top block: Avatar, Name, Email (No outline)
    layout vertical, gap: small, align: center:
      image avatar_url, size: 96, round: true
      label user_name, style: heading
      label user_email, style: caption

    # Bottom block: Three action buttons in a horizontal row
    layout horizontal, gap: medium, align: center:
      OutlinedButton "Edit", on tap: edit()
      OutlinedButton "Share", on tap: share()
      OutlinedButton "Sign Out", on tap: sign_out()

  edit():
    print("Edit tapped")

  share():
    print("Share tapped")

  sign_out():
    print("Sign Out tapped")
```