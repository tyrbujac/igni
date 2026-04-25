```igni
screen ArticleReader, background: white:
  article_title = "The Quiet Shape of a Readable Page"
  byline = "By Mara Vale · 8 min read"

  section_one = "A calmer column"
  section_two = "Space that supports focus"

  paragraph_one = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae arcu sed nibh placerat tempor. A readable page does not ask the eye to travel too far, and it does not crowd every available pixel simply because the window has room."
  paragraph_two = "Praesent commodo, sapien at facilisis pulvinar, neque sem tincidunt risus, vitae gravida justo lorem sed erat. The best long-form layouts leave generous space at the sides so that the article itself can stay steady, quiet, and easy to scan."
  paragraph_three = "Donec non magna vel justo congue luctus. In a wide desktop view, the empty margins are not wasted space; they are part of the reading system. They frame the text, reduce fatigue, and give headings enough room to feel intentional."
  paragraph_four = "Suspendisse potenti. Curabitur dignissim, lorem in blandit feugiat, augue sem posuere neque, a venenatis ipsum est sit amet mi. A comfortable column helps paragraphs keep a human rhythm instead of stretching into long, difficult lines."
  paragraph_five = "Aliquam erat volutpat. Nulla facilisi. When the interface respects the shape of reading, navigation can remain close at hand while the content stays calm, centered, and focused."
  paragraph_six = "Vivamus porta, massa non luctus consequat, justo lectus consequat lorem, sed sagittis arcu augue at libero. The result is a page that feels designed for attention rather than for the raw size of the screen."

  layout vertical, fill: true:
    layout horizontal, padding: medium, background: card, align: center:
      layout vertical, fill: true, align: start:
        button "Back", color: subtle, on tap: navigate back

      layout vertical, fill: true, align: center:
        label article_title, style: heading.small, align: center

      layout vertical, fill: true, align: end:
        button "Share", color: brand, on tap: share()

    divider

    layout horizontal, fill: true, padding: large, align: start:
      layout vertical, fill: true

      layout vertical, fill: true, max_width: tablet, padding: large, gap: medium:
        label article_title, style: heading
        label byline, style: caption, color: subtle

        divider

        label paragraph_one, style: body
        label paragraph_two, style: body

        label section_one, style: heading.small
        label paragraph_three, style: body
        label paragraph_four, style: body

        label section_two, style: heading.small
        label paragraph_five, style: body
        label paragraph_six, style: body

      layout vertical, fill: true

  share():
    print(article_title)
```

Design decisions:

- The article column uses `max_width: tablet`, which caps it at Igni’s 768px tablet width token. That keeps the text from stretching across a 1400px+ desktop window.
- The article sits between two empty `fill: true` layouts. Those side layouts split the remaining horizontal space equally, so the capped article column stays centered.
- The article column also has `padding: large`, and Igni’s `max_width:` includes padding, so the actual text line length is a little narrower than 768px.
- The header uses three equal `fill: true` cells: left for Back, center for the title, and right for Share. This keeps the title visually centered even if the buttons have different widths.
- `Share` logs the article title with `print()` because the provided Igni spec does not define a native sharing primitive.