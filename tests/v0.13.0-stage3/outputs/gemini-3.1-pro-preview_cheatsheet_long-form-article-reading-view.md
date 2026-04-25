```igni
screen ArticleView:
  # Header Bar
  layout horizontal, spread: true, align: center, padding: medium, background: card:
    button "Back", color: subtle, on tap: navigate back
    label "The Silent UI", style: heading.small
    button "Share", color: subtle, on tap: print("Share tapped")

  # Centered Article Container
  layout vertical, align: center, padding: large:
    
    # Article Body (Capped width for readability)
    layout vertical, max_width: tablet, gap: medium:
      
      label "The Silent UI", style: heading
      label "By Alex Vance • November 12, 2024", style: caption, color: subtle
      divider
      
      label "The Disappearing Act", style: heading.small
      label "Good design is obvious. Great design is transparent. For decades, interface designers have struggled with the balance between capability and complexity. We built complex dashboards, endless navigation trees, and dense property panels, assuming that power required cognitive overhead."
      label "But a new paradigm is emerging. The silent UI doesn't ask for your attention until it needs it. It prefers context over controls. By relying on lexical reactivity, the interface binds directly to the user's intent without exposing the wiring."
      
      label "Lexical Reactivity", style: heading.small
      label "When state is just plain variables, the mental model flattens. You no longer think about when to trigger a re-render or how to marshal data across boundaries. You assign a value, and the surface reflects it. It is a physical property of the digital material."
      label "This isn't merely a developer convenience; it translates directly to the user experience. Applications become more robust, edge cases disappear, and the product feels fundamentally more solid in the hand. The interface gets out of the way."
      label "Ultimately, the goal of any tool is to close the gap between thought and action. By capping our layouts, reducing our boilerplate, and silencing the noise, we allow the content itself to become the interface."
```

### Design Decisions

**1. Implicit Vertical Stacking:**
Notice there is no single root `layout vertical:` wrapping the whole screen. Because Igni screen bodies stack vertically by default, placing the header layout and the article layout sequentially naturally creates a full-page column, keeping us well within the 4-level nesting limit.

**2. Constraining the Reading Width:**
Long lines of text on a 1400px monitor cause eye fatigue. To fix this, the innermost layout holding the text uses `max_width: tablet`. The Igni `tablet` token caps the element at 768px. This naturally creates lines of about 65–80 characters — the typographic ideal for long-form reading — regardless of how wide the user stretches their browser window.

**3. Centering the Article:**
Because `max_width:` caps the layout's size but doesn't dictate its placement, the capped layout is wrapped in a `layout vertical, align: center`. In Igni, applying `align: center` to a vertical column aligns its children along the cross-axis. This guarantees the 768px reading column stays pinned to the dead centre of the screen while the empty space breathes equally on both sides.

**4. The Header Bar:**
The header uses `layout horizontal, spread: true` to push the "Back" and "Share" buttons to the far left and right edges, stranding the title in the middle. We combine this with `align: center` to ensure the buttons and the text are perfectly aligned vertically along their shared row, and drop a `background: card` behind it to visually separate the navigation from the reading canvas.