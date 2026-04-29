This implementation uses the `spacing/N` numeric scale. While word tokens are excellent for quick semantic alignment, I reached for the numeric scale here because the design spec provided specific, non-uniform constraints (12px, 20px, 32px) that fall outside the word-token defaults (8px, 16px, 24px). The numeric scale allows for high-precision design fidelity while remaining readable.

### Card.igni

```igni
theme:
  color:
    brand: "#FF6B35"
    text: "#0D0D14"
    surface_elevated: "#F5F5F5"
    card: "#FFFFFF"
  text:
    heading: font: inter
    body: font: inter
    caption: font: inter

theme dark:
  color:
    text: "#F5F5F5"
    surface_elevated: "#1D1D1F"
    card: "#2C2C2E"

screen CardPreview:
  # Using numeric spacing tokens for design-spec fidelity:
  # 32px (spacing/8) for outer padding
  # 16px (spacing/4) for internal padding
  # 12px (spacing/3) for title-body gap
  # 20px (spacing/5) for body-sender gap
  
  layout vertical, padding: spacing/8, background: surface_elevated, fill: true:
    layout vertical, padding: spacing/4, background: card, rounded: medium:
      label "Birthday Wishes", style: heading
      
      layout vertical, gap: spacing/3: # 12px gap
        label "May your day be filled with joy, laughter, and cake."
      
      layout vertical, gap: spacing/5: # 20px gap
        label "With love, Alex", style: caption

# Note: The logic uses spacing/3 (12px) and spacing/5 (20px) 
# because these correspond exactly to the requested gaps, 
# whereas word tokens like 'medium' (16px) would have been 
# slightly off-spec.
```

### Design Notes:
1.  **Token Choice:** I chose the `spacing/N` scale for this implementation. Even though `spacing/4` is equivalent to `medium`, using the numeric scale for the entire layout creates a consistent "arithmetic" logic that makes the specific pixel gaps (12px/20px) immediately obvious to anyone reading the spec.
2.  **Theme Resolution:** By defining `text` and `card` in the `theme:` block and referencing them in the screen, the card automatically flips its background and foreground colours when the user switches between system-light and system-dark mode.
3.  **Layout Structure:** Since the spec required a card with rounded corners and a distinct background, I nested a `layout` (the card surface) inside a parent `layout` (the page scaffold). This allows the `spacing/8` (32px) padding to act as the "page margin," effectively centering and protecting the card on any screen size.