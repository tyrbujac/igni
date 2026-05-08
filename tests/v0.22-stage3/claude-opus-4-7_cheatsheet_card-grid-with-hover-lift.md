```igni
screen RecipeBook:
  recipes = [
    {title: "Sourdough Loaf", image: "sourdough.jpg"},
    {title: "Tomato Risotto", image: "risotto.jpg"},
    {title: "Lemon Tart", image: "lemon_tart.jpg"}
  ]

  layout vertical, padding: large, gap: medium:
    label "Recipes", style: heading
    layout horizontal, gap: medium:
      each recipe in recipes:
        RecipeCard recipe

component RecipeCard(recipe):
  layout vertical, fill: true, background: card, rounded: medium, padding: medium, gap: small:
    hover:
      background: brand
      shadow: medium
      cursor: pointer

    image recipe.image, size: 160
    label recipe.title, style: title

    layout horizontal, gap: none:
      icon "heart", size: medium, color: subtle
      icon "share", size: medium, color: subtle
      icon "more", size: medium, color: subtle
```