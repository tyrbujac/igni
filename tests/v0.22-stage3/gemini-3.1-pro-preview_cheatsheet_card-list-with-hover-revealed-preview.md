```igni
screen Library:
  books = [
    {
      title: "The Dispossessed",
      image: "https://covers.openlibrary.org/b/id/8259443-M.jpg",
      description: "An isolated physicist travels to a capitalist twin planet."
    },
    {
      title: "Dune",
      image: "https://covers.openlibrary.org/b/id/1532467-M.jpg",
      description: "A young noble inherits the most dangerous planet in the universe."
    },
    {
      title: "Neuromancer",
      image: "https://covers.openlibrary.org/b/id/8750486-M.jpg",
      description: "A washed-up hacker is hired for the ultimate cyber-heist."
    }
  ]

  layout vertical, padding: large, gap: medium:
    label "Reading List", style: heading
    
    each book in books:
      BookCard book

component BookCard(book):
  # transition: fade smoothly animates the description popping in/out
  layout vertical, padding: medium, background: card, rounded: medium, gap: small, transition: fade:
    
    # 1. Property-only overrides on hover
    hover:
      background: brand
      cursor: pointer
    
    image book.image, size: 120
    label book.title, style: title
    
    # 2. Structural/primitive additions on hover
    if is_hovered():
      label book.description, style: caption
```