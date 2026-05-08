```igni
screen Library:
  books = [
    {title: "The Left Hand of Darkness", cover: "left_hand.jpg", preview: "A lone envoy navigates a world of ambisexual beings on an icebound planet."},
    {title: "Project Hail Mary", cover: "hail_mary.jpg", preview: "A lone astronaut wakes with no memory and a mission to save Earth."},
    {title: "Piranesi", cover: "piranesi.jpg", preview: "A man explores an infinite house of statues, tides, and forgotten halls."},
    {title: "The Fifth Season", cover: "fifth_season.jpg", preview: "On a continent wracked by apocalypses, a mother hunts the man who broke the world."}
  ]

  layout vertical, gap: medium, padding: large, max_width: tablet:
    label "Library", style: heading

    each book in books:
      layout vertical, gap: small, padding: medium, background: card, rounded: medium:
        hover:
          background: brand
          cursor: pointer

        image book.cover, size: 120
        label book.title, style: title

        if is_hovered():
          label book.preview, style: caption
```