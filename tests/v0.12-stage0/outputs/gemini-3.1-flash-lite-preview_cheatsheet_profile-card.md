```igni
screen Profile, background: teal:
  layout vertical, fill: true, align: center, gap: large:
    image "avatar.png", size: 120, round: true
    
    label "Joe Bloggs", style: heading.large, font: "Pacifico"
    label upper("Igni Developer"), style: heading.small, font: "Source Sans Pro"
    
    divider
    
    layout vertical, gap: medium:
      layout horizontal, gap: small, align: center:
        icon "phone", color: white
        label "+44 7700 900123", font: "Source Sans Pro"
      
      layout horizontal, gap: small, align: center:
        icon "email", color: white
        label "joe.bloggs@example.com", font: "Source Sans Pro"
```

### Design Decisions

*   **Centering:** By using `layout vertical` with `fill: true` and `align: center` as the root element of the screen, the entire content block is anchored perfectly in the middle of the teal background.
*   **Typography:** The spec allows for standard text styles (`heading`, `body`), and the `font:` property is applied directly to the labels to satisfy the requirement for custom font families. 
*   **Font Implementation:** In Igni, the `font:` property overrides the default font-family for that specific text primitive. Since typography is load-bearing here, I applied the specific fonts ("Pacifico" and "Source Sans Pro") at the label level to ensure the visual hierarchy matches your request exactly.
*   **Formatting:** `upper()` is used on the job title string to force the all-caps requirement dynamically, ensuring the data remains clean in the code while appearing styled in the UI.
*   **Structure:** I used a nested `layout horizontal` inside the main vertical stack to align the icons and text labels side-by-side for the contact section, maintaining a consistent `align: center` across all elements.