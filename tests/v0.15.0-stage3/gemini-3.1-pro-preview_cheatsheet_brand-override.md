```igni
theme:
  color:
    brand: "#FF6B35"

screen Settings, title: "Settings":
  dark_mode = false

  layout vertical, padding: large, gap: medium:
    toggle bind: dark_mode, label: "Dark mode"
    divider
    button "Logout", color: brand, on tap: logout()

  logout():
    print("Logging out...")
    navigate back
```

### How the colour rendering works

In Igni, inline hex codes (like `color: "#FF6B35"`) are parse-time errors. To get a custom hex colour onto a UI element, it must flow through the theming system:

1. **Declaration**: The top-level `theme:` block patches the project-wide design tokens. Under `color:`, we override the built-in `brand` token with the custom hex code `"#FF6B35"`. 
2. **Usage**: Down in the `button` primitive, we use the unquoted token name `color: brand`. 
3. **Rendering**: When the Igni transpiler processes the file, it reads the `color: brand` token, looks up the active theme definition, finds the `#FF6B35` override, and natively maps it into the compiled Flutter widget tree. This enforces a strict separation of design tokens from component logic.