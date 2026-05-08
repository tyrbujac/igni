```igni
screen Bookstore:
  books = [
    {id: 1, title: "The Great Gatsby", cover: "gatsby.png", desc: "A story of excess."},
    {id: 2, title: "1984", cover: "1984.png", desc: "A vision of the future."},
    {id: 3, title: "Beloved", cover: "beloved.png", desc: "A powerful haunting."}
  ]

  layout vertical, padding: large, gap: medium:
    label "Library", style: heading
    each book in books:
      BookCard book

component BookCard(book):
  layout vertical, padding: medium, background: card, rounded: medium:
    hover:
      background: brand
      cursor: pointer

    image book.cover, size: 80
    label book.title, style: title

    if is_hovered():
      label book.desc, style: caption
```