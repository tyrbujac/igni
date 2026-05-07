```igni
screen Recipes:
  recipes = [
    {title: "Sourdough Loaf", image: "sourdough.jpg"},
    {title: "Tomato Risotto", image: "risotto.jpg"},
    {title: "Lemon Tart", image: "lemon_tart.jpg"}
  ]

  layout vertical, padding: large, gap: medium:
    label "Recipes", style: heading
    layout horizontal, gap: medium:
      each recipe in recipes:
        layout vertical, fill: true, padding: medium, background: card, rounded: medium, gap: small:
          hover:
            background: brand
            shadow: medium
            cursor: pointer
          image recipe.image
          label recipe.title, style: title
          layout horizontal, gap: none:
            icon "heart", size: medium, color: subtle
            icon "share", size: medium, color: subtle
            icon "more", size: medium, color: subtle
```