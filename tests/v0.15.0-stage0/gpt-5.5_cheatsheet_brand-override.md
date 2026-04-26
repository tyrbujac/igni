```igni
theme:
  color:
    brand: "#FF6B35"

screen Settings, title: "Settings":
  notifications = true
  dark_mode = false

  layout vertical, padding: large, gap: medium:
    label "Settings", style: heading

    toggle bind: notifications, label: "Notifications"
    toggle bind: dark_mode, label: "Dark mode"

    layout vertical, fill: true

    button "Logout", color: brand, on tap: logout()

  logout():
    print("Logged out")
```

The custom colour is declared in the top-level `theme:` block:

```igni
brand: "#FF6B35"
```

That overrides Igni’s built-in `brand` colour token project-wide. The button then uses the token by name:

```igni
button "Logout", color: brand
```

So the rendered button receives the themed `brand` colour, which resolves to `#FF6B35`._INLINE hex is not used on the button; the hex value lives only in `theme:` as required by Igni._