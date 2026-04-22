```igni
screen ProfileCard, background: teal:
  layout vertical, fill: true, align: center:
    layout vertical, align: center, gap: medium:
      image "avatar.png", size: 120, round: true
      label "Joe Bloggs", style: heading, color: white
      label upper("Igni Developer"), style: body, color: white
      divider
      layout horizontal, align: center, gap: medium:
        icon "phone", color: white
        label "+44 7700 900123", color: white
      layout horizontal, align: center, gap: medium:
        icon "email", color: white
        label "joe.bloggs@example.com", color: white
```

### Brief explanation

- **Centering:** I used an outer `layout vertical, fill: true, align: center:` so the card content is centered within the full screen.
- **Full-screen teal background:** Set directly on the screen with `background: teal`.
- **Avatar:** `image "avatar.png", size: 120, round: true` gives a circular profile image.
- **Typography hierarchy:**  
  - Name uses `style: heading` to make it large.
  - Subtitle uses `upper("Igni Developer")` to produce the required all-caps text.
- **Divider and contact rows:** Implemented with `divider` and two horizontal layouts containing `icon` + `label`.

### Important note about fonts

Using **only** the Igni spec provided, there is **no font-family property** and no support for specifying custom fonts like **Pacifico** or **Source Sans Pro** on labels. So the code above matches the layout, content, color, spacing, and text hierarchy, but it **cannot explicitly enforce those font families** in valid Igni as currently specified.

If font-family control is required, Igni would need an added text property such as:

```igni
label "Joe Bloggs", font: "Pacifico"
label "IGNI DEVELOPER", font: "Source Sans Pro"
```

But that syntax is **not in the spec**, so I did not use it.