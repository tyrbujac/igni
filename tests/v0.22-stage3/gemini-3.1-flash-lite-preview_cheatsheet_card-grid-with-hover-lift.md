To build this, we define a custom `RecipeCard` component. The grid is constructed using a horizontal `layout` that wraps its children (though the spec doesn't provide a `grid` primitive, we use a standard `layout` with individual card components).

```igni
# Recipe model definition
recipe = {
  title: String,
  image: String,
  is_fav: Bool
}

screen Recipes:
  # Mock data
  recipes: [recipe] = [
    {title: "Pasta Carbonara", image: "pasta.jpg", is_fav: true},
    {title: "Avocado Toast", image: "toast.jpg", is_fav: false},
    {title: "Berry Smoothie", image: "smoothie.jpg", is_fav: true}
  ]

  layout horizontal, gap: medium, padding: large:
    each r in recipes:
      RecipeCard r

component RecipeCard(r):
  layout vertical, padding: medium, background: card, rounded: medium:
    hover:
      background: brand
      shadow: medium
      cursor: pointer

    image r.image, size: 120, round: true
    label r.title, style: title

    layout horizontal, gap: small:
      icon "heart", color: brand
      icon "share", color: subtle
      icon "more", color: subtle
```

### Design Notes based on the spec:
1.  **Grid:** Igni layouts are linear. `layout horizontal` creates the 3-column row.
2.  **Hover:** The `hover:` sub-block handles the visual lift (background shift, shadow, cursor). Note that `hover:` is a layout property modifier, not an `if` block, making it the most efficient way to handle property overrides.
3.  **Icon row:** The `gap: small` ensures the icons stay "tightly packed."
4.  **Composition:** `RecipeCard` encapsulates the UI logic. By passing the whole `recipe` object `r`, the component remains clean.
5.  **Reactivity:** If any recipe data were to change, the `each` iteration ensures the UI re-renders, following the lexical reactivity rules defined in the cheatsheet.