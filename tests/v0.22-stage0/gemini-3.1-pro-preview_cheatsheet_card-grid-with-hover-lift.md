```igni
screen RecipeGrid:
  recipes = [
    {title: "Spicy Arrabbiata", image: "arrabbiata.jpg"},
    {title: "Wild Mushroom Risotto", image: "risotto.jpg"},
    {title: "Classic Lemon Tart", image: "tart.jpg"}
  ]

  layout horizontal, gap: large, padding: large:
    each recipe in recipes:
      RecipeCard recipe

component RecipeCard(recipe):
  layout vertical, fill: true, padding: medium, gap: small, background: card, rounded: medium:
    hover:
      background: brand
      shadow: medium
      cursor: pointer
      
    image recipe.image
    label recipe.title, style: title
    
    layout horizontal, gap: none, align: center:
      icon "heart", color: subtle
      icon "share", color: subtle
      icon "more", color: subtle
```

### Why this works:
* **3-Column Grid:** Iterating exactly 3 items inside a `layout horizontal` where the child's root layout has `fill: true` automatically splits the row into 3 equal columns.
* **Hover Properties:** The `hover:` sub-block correctly contains only property overrides (no primitive children) and leverages the specific whitelist allowed (`background:`, `shadow:`, `cursor:`).
* **Tightly Packed Icons:** Uses the explicit `none` token introduced in v0.22 for `gap:`, natively forcing zero space between the icons.
* **Component Invocation:** The component is capitalized (`RecipeCard`) and called without parentheses (`RecipeCard recipe`), strictly adhering to Igni's invocation and syntax rules.