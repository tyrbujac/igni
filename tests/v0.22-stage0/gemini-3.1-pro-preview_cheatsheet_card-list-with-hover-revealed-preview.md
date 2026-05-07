Here is the complete Igni app fulfilling your spec. 

It defines a top-level `screen` that loops over a list of book objects, delegating each to a `BookCard` component. The component uses the v0.22 `hover:` block for smooth background/cursor transitions, and the `is_hovered()` builtin to conditionally reveal the description text.

```igni
screen BookList:
  books = [
    {
      title: "Dune", 
      cover: "dune.jpg", 
      description: "Paul Atreides navigates politics and prophecy on the desert planet Arrakis."
    },
    {
      title: "Neuromancer", 
      cover: "neuromancer.jpg", 
      description: "A washed-up console cowboy is hired for one last heist in cyberspace."
    },
    {
      title: "Foundation", 
      cover: "foundation.jpg", 
      description: "A mathematician establishes a colony to preserve human knowledge across millennia."
    }
  ]

  layout vertical, padding: large, gap: medium, align: center:
    label "Reading List", style: heading
    
    each book in books:
      BookCard book

component BookCard(book):
  layout vertical, padding: medium, gap: small, background: card, rounded: medium, max_width: phone:
    hover:
      background: brand
      cursor: pointer
      
    image book.cover, size: 120
    label book.title, style: title
    
    if is_hovered():
      label book.description, style: caption
```

### Why it works this way:
* **`hover:` sub-block**: Kept cleanly inside the layout to handle property overrides (like `background:` changing to `brand`). It automatically transitions over ~150ms by default.
* **`is_hovered()`**: Used strictly inside the conditional `if` block to introduce new UI primitives (the description label) dynamically when the innermost enclosing layout is hovered.
* **Max Width**: `max_width: phone` is applied to the component's root layout, and `align: center` to the screen's layout. This forces the cards to top out at 480px and beautifully centers them no matter how wide the browser/screen is.
* **Lexical Scope Protection**: By keeping the card as a single `layout vertical` rather than splitting image and text into nested sub-layouts, `is_hovered()` correctly registers whenever the user points at *any part* of the card.