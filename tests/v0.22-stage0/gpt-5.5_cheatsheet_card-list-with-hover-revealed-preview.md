```igni
component BookCard(book):
  layout vertical, padding: medium, gap: small, background: card, rounded: medium:
    hover:
      background: brand
      cursor: pointer

    image book.cover, size: 120
    label book.title, style: title

    if is_hovered():
      label book.description, style: caption

screen Books:
  books = [
    {
      title: "Project Hail Mary",
      cover: "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
      description: "A lone astronaut wakes up light-years from home with a mission he cannot remember."
    },
    {
      title: "The Left Hand of Darkness",
      cover: "https://covers.openlibrary.org/b/isbn/9780441478125-L.jpg",
      description: "An envoy visits a frozen world where society challenges every assumption he carries."
    },
    {
      title: "Piranesi",
      cover: "https://covers.openlibrary.org/b/isbn/9781526622433-L.jpg",
      description: "A quiet, mysterious novel about a man living inside an endless house of tides and statues."
    },
    {
      title: "The Night Circus",
      cover: "https://covers.openlibrary.org/b/isbn/9780307744432-L.jpg",
      description: "Two young magicians are bound into a beautiful contest inside a travelling midnight circus."
    }
  ]

  layout vertical, padding: large, gap: medium:
    label "Books", style: heading

    each book in books:
      BookCard book
```