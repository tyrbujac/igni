```igni
screen Library:
  books = [
    {title: "The Pragmatic Programmer", cover: "pragprog.png", preview: "Your journey to mastery, 20th anniversary edition."},
    {title: "Designing Data-Intensive Applications", cover: "ddia.png", preview: "The big ideas behind reliable, scalable, and maintainable systems."},
    {title: "The Mythical Man-Month", cover: "mmm.png", preview: "Essays on software engineering and project management."},
    {title: "Refactoring", cover: "refactoring.png", preview: "Improving the design of existing code."}
  ]

  layout vertical, gap: medium, padding: large:
    label "Library", style: heading
    each book in books:
      BookCard book

component BookCard(book):
  layout vertical, gap: small, padding: medium, background: card, rounded: medium:
    hover:
      background: brand
      cursor: pointer

    image book.cover, size: 120
    label book.title, style: title

    if is_hovered():
      label book.preview, style: caption
```