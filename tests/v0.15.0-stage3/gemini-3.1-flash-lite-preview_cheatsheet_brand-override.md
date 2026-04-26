```igni
theme:
  color:
    brand: "#FF6B35"

screen Settings:
  layout vertical, padding: large, gap: medium:
    label "Settings", style: heading
    
    # Example setting
    toggle bind: shared.dark_mode, label: "Dark Mode"
    
    button "Logout", color: brand, on tap: logout()

  logout():
    # Placeholder for auth clear logic
    navigate to Login
```

### How the colour flows:
1. **Definition:** The `theme:` block at the top level registers the token `brand` with the hex value `#FF6B35`. 
2. **Registration:** Because Igni forbids raw hex strings in the UI body, the transpiler resolves all `color:` and `background:` references against the `theme` dictionary.
3. **Application:** When the `button` primitive is rendered, the compiler looks up the `brand` key, retrieves the mapped hex string, and applies it to the background and border properties of the button in the underlying Flutter implementation.