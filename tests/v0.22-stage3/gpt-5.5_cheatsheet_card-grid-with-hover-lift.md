```igni
component RecipeCard(recipe):
  layout vertical, fill: true, padding: medium, gap: small, background: card, rounded: medium, on tap: print(recipe.title):
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

screen RecipeGrid, title: "Recipes":
  recipes = [{title: "Lemon Herb Salmon", image: "lemon-herb-salmon.jpg"}, {title: "Roasted Butternut Risotto", image: "butternut-risotto.jpg"}, {title: "Miso Mushroom Ramen", image: "miso-mushroom-ramen.jpg"}]

  layout vertical, padding: large, gap: medium:
    label "Featured Recipes", style: heading

    layout horizontal, gap: medium, max_width: desktop:
      each recipe in recipes:
        RecipeCard recipe
```