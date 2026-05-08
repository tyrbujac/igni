```igni
screen RecipeGrid:
  recipes = [
    {title: "Spicy Arrabbiata", image: "arrabbiata.jpg"},
    {title: "Mushroom Risotto", image: "risotto.jpg"},
    {title: "Lemon Butter Salmon", image: "salmon.jpg"}
  ]

  layout horizontal, padding: large, gap: large:
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
    
    # Tightly packed icon row via v0.22 `none` spacing token
    layout horizontal, gap: none, align: center:
      icon "heart", color: subtle
      icon "share", color: subtle
      icon "more", color: subtle
```

### Design Notes

*   **Grid structure:** Igni achieves column grids by putting `fill: true` on sibling layouts inside a `layout horizontal`. By placing `fill: true` on the `RecipeCard`'s root `layout vertical`, all three cards share the row's remaining width equally.
*   **Hover block:** The v0.22 `hover:` sub-block cleanly groups visual overrides without needing a local reactive variable or `is_hovered()` check, and automatically provides the ~150ms ease-out transition.
*   **Spacing tokens:** The card uses `gap: small` for breathing room between the image, title, and icons. The inner icon row explicitly strips spacing using the v0.22 `gap: none` token.
*   **Component invocation:** `RecipeCard recipe` invokes the PascalCase component dynamically in the loop, passing the object without parentheses.