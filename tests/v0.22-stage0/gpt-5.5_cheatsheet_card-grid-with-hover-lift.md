```igni
screen Recipes:
  recipes = [
    {title: "Lemon Herb Salmon", image: "lemon-herb-salmon.jpg"},
    {title: "Roasted Tomato Pasta", image: "roasted-tomato-pasta.jpg"},
    {title: "Mango Chicken Tacos", image: "mango-chicken-tacos.jpg"}
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

    image recipe.image, size: 180
    label recipe.title, style: title

    layout horizontal, gap: none:
      icon "favorite", size: small
      icon "share", size: small
      icon "more_horiz", size: small
```