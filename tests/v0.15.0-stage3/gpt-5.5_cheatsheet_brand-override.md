```igni
theme:
  color:
    brand: "#FF6B35"

screen Settings, title: "Settings":
  layout vertical, padding: large, gap: medium:
    label "Settings", style: heading
    button "Logout", color: brand, on tap: logout()

  logout():
    print("Logged out")
```

The custom colour is declared in the top-level `theme:` block:

```igni
brand: "#FF6B35"
```

That overrides Igni’s built-in `brand` colour token for the whole project. The button then uses that token:

```igni
button "Logout", color: brand
```

So the rendered logout button receives the themed `brand` colour, which resolves to `#FF6B35`. Inline hex values are not used on the button itself; the colour flows through the theme token.