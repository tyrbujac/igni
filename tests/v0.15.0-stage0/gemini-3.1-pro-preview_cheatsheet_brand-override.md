```igni
theme:
  color:
    brand: "#FF6B35"

screen Settings, title: "Settings":
  layout vertical, padding: large:
    label "Account", style: heading
    button "Logout", color: brand, on tap: logout()

  logout():
    navigate back
```

### How the colour applies:

1. **Declaration (`theme:`):** Igni strictly rejects inline hex codes in the UI (e.g., `color: "#FF6B35"` is a parse error). Instead, the top-level `theme:` block safely overrides the built-in `brand` token with your custom hex value. 
2. **Usage (`color: brand`):** Down in the screen body, the button references the design token by its unquoted name (`brand`).
3. **Compilation:** When Igni compiles to Flutter, it looks up the `brand` token in the theme registry, grabs `#FF6B35`, and injects it into the generated Flutter widget's styling. This enforces a single source of truth for all colour decisions.