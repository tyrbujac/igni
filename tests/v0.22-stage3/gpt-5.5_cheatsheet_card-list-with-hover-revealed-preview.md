```igni
screen Books, title: "Book Cards":
  books = [{title: "Pride and Prejudice", cover: "pride_and_prejudice.jpg", preview: "A sharp, romantic comedy of manners in Regency England."}, {title: "The Left Hand of Darkness", cover: "left_hand_of_darkness.jpg", preview: "A diplomat crosses an icebound world of shifting identity."}, {title: "The Hobbit", cover: "the_hobbit.jpg", preview: "Bilbo Baggins leaves home for treasure, dragons, and courage."}, {title: "The Name of the Rose", cover: "name_of_the_rose.jpg", preview: "A medieval abbey mystery wrapped in philosophy and intrigue."}]

  layout vertical, padding: large, gap: medium:
    label "Featured Books", style: heading

    each book in books:
      BookCard book

component BookCard(book):
  layout vertical, padding: medium, gap: small, background: card, rounded: medium:
    hover:
      background: brand
      cursor: pointer

    image book.cover, size: 120
    label book.title, style: title

    if is_hovered():
      label book.preview, style: caption
```