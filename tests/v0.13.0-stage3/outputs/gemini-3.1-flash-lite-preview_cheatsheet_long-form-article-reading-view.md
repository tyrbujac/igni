Here is the Igni code for the long-form article view.

```igni
screen ArticleView:
  # Header Bar
  layout horizontal, padding: large, background: card, spread: true:
    button "Back", on tap: navigate back
    label "The Beauty of Constraints", style: heading.small
    button "Share", on tap: print("Sharing article")

  # Centered reading container
  layout vertical, align: center:
    layout vertical, max_width: desktop, padding: large, gap: medium:
      
      # Title and Meta
      label "The Beauty of Constraints", style: heading
      label "By Alex Rivers • October 24, 2023", style: caption
      divider

      # Section 1
      label "Defining Simplicity", style: heading.small
      label "Igni is built on the philosophy that UI code should be as readable as a design spec. By removing classes, imports, and boilerplate, it allows developers to focus entirely on the user experience and state flow."
      label "When we treat the UI as a function of state, we eliminate the need for complex controllers. Instead of managing listeners and observers, we simply define our views and let the reactivity system handle the re-renders automatically."

      # Section 2
      label "The Power of Reactivity", style: heading.small
      label "Lexical reactivity is the engine under the hood. When a variable is reassigned, the screen simply re-evaluates. This isn't just a simplification; it's a fundamental shift in how we think about the lifecycle of a screen."
      label "The logic is predictable and top-to-bottom. You don't hunt for state changes in distant files. You look at a function, see the variable assignment, and know exactly what will happen on the screen."
      label "This approach works across the board, whether you are managing a simple local counter, fetching data from an API, or dealing with shared state across multiple navigation points."
      label "Ultimately, constraints create freedom. By limiting the toolset, Igni prevents over-engineering and keeps the code lean, fast, and understandable."
```

### Design Decisions

1.  **The Reading Column (`max_width: desktop`):** To solve the "over-wide text" issue on desktop screens, I wrapped the content in a `layout vertical` with `max_width: desktop`. This forces the content block to cap at 1200px regardless of how wide the user's window is.
2.  **Centering:** By nesting that content container inside a parent `layout vertical` with `align: center`, the entire reading column is locked to the horizontal center of the viewport, ensuring that even on ultra-wide monitors, the text remains in the center of the user's field of vision.
3.  **Header Structure:** I used `layout horizontal` with `spread: true` for the header. This property is ideal for a classic UI header, as it automatically pushes the "Back" button to the far left, the "Share" button to the far right, and centers the article title in the available space between them.
4.  **Semantic Nesting:** I separated the Header and Body into distinct top-level `layout` blocks within the screen. This ensures the Header spans the full width of the screen (as intended for a top bar), while the Body container adheres to the max-width constraint, keeping the presentation clean and hierarchical.