Here is the full `Card.igni` implementation. 

I chose to use the **numeric scale (`spacing/N`) exclusively**. Here is why:
The design spec calls for highly specific, fine-grained intervals — 12 px, 20 px, and 32 px. These land exactly on `spacing/3`, `spacing/5`, and `spacing/8`. The word tokens (`small`, `medium`, `large`) only cover the 8 / 16 / 24 px rungs; they physically cannot represent the requested gaps or the outer padding. 

While I *could* have used `medium` for the 16 px padding and rounding, mixing the two vocabularies (`padding: medium, gap: spacing/5`) on the same line creates cognitive friction. By adopting the numeric scale universally, the file gains a predictable, mathematical consistency (N × 4 px) that translates perfectly from a Figma spec.

```igni
theme:
  color:
    text: "#1C1C1E"                # Dark text for light mode
    surface_elevated: "#FFFFFF"    # Crisp white card surface
    page_bg: "#F2F2F7"             # Soft gray window background to contrast the card
  scaffold:
    background: page_bg

theme dark:
  color:
    text: "#F2F2F7"                # Off-white text for dark mode
    surface_elevated: "#2C2C2E"    # Elevated dark-gray surface
    page_bg: "#000000"             # True black window background
  scaffold:
    background: page_bg

screen Card:
  # Outer padding: 32 px (spacing/8)
  layout vertical, padding: spacing/8:
    
    # The Card: 16 px padding/rounding (spacing/4), 20 px gap to sender (spacing/5)
    layout vertical, background: surface_elevated, padding: spacing/4, rounded: spacing/4, gap: spacing/5:
      
      # Title & Body Group: 12 px gap (spacing/3)
      layout vertical, gap: spacing/3:
        label "A Special Note", style: heading, color: text
        label "Wishing you the absolute best on your special day. Hope it brings you everything you're looking for.", style: body, color: text
      
      # Sender
      label "— Alex", style: caption, color: text
```

### Design Notes & Spec Compliance
* **Theme Mode Propagation:** By assigning `color: text` to the labels and `background: surface_elevated` to the card layout, Igni automatically tracks changes to `shared.theme_mode` or the OS appearance. The text and card will natively swap hex values when toggled.
* **Structural Sub-blocks:** The `theme: scaffold:` block is defined in both variants, pointing to `page_bg`, ensuring the app window properly frames the card in both light and dark environments.
* **Layout Discipline:** The varied gaps (12 px inner, 20 px outer) are handled smoothly through a nested `layout vertical`. All layout properties remain strictly on one line without backslash continuations, per Igni's syntax rules.