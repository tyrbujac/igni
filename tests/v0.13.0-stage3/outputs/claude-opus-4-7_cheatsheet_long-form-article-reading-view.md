```igni
screen Article:
  article_title = "The Quiet Joy of Slow Software"
  byline = "By Jane Doe · Published March 14"

  layout vertical:
    # Header bar — full window width, three slots
    layout horizontal, padding: medium, spread: true, background: card:
      button "Back", color: subtle, on tap: navigate back
      label article_title, style: heading.small, align: center
      button "Share", color: brand, on tap: share()

    # Article body — capped at tablet (768px), centred in remaining space
    layout vertical, align: center, max_width: tablet, padding: large, gap: medium:
      label article_title, style: heading
      label byline, style: caption

      label "Beginnings", style: heading.small
      label "There is a particular pleasure in software that does not rush you. It loads when you ask it to load. It saves when you ask it to save. It does not, in the meantime, attempt to predict what you might want next, nor does it pulse and shimmer to remind you that it exists."
      label "For a long time we mistook responsiveness for speed. A program that flickered constantly looked alive, and a program that sat still looked broken. But sitting still, it turns out, is what most tools should do most of the time. A hammer does not animate between swings."

      label "Reflections", style: heading.small
      label "When I open my oldest text editor — the one I have used, in some form, for nearly fifteen years — there is no splash screen. There is no telemetry prompt. There is a blinking cursor on a blank page, and that is the entire welcome experience. It is, by any reasonable measure, sufficient."
      label "Slow software is not slow in the sense of being sluggish. It is slow in the sense of being patient. It does one thing, waits, does another thing, waits again. The waiting is not wasted; the waiting is where you live."
      label "I have started to notice which tools leave room for me and which tools fill that room with themselves. The good ones, almost without exception, are quiet. They do their work and then they get out of the way, which is, after all, the entire job."

  share():
    print("shared: " + article_title)
```

## Design notes

**The reading-width problem.** On a 1400px+ window, line lengths over ~90 characters tank readability. The article body therefore lives inside `layout vertical, ..., max_width: tablet`, capping it at 768px regardless of how wide the screen gets. I picked `tablet` over `phone` because long-form prose reads better with a bit more width than a phone column, and over `desktop` because `desktop` (1200px) is too wide for body copy. Tokens-only — there's no way to dial in 720px or 680px directly.

**Centring the body in the remaining space.** I followed the pattern from the spec's "centered card" example: `align: center` together with `max_width: tablet` on the body's vertical layout. The header bar above it is a separate sibling layout with no `max_width`, so it spans the full window — exactly what you want for a header.

**Header layout.** `layout horizontal, spread: true` with three children (back button, title label, share button) pushes the buttons to the edges and lets the title sit between them. `align: center` on the title label keeps the text centred within whatever slot `spread:` gives it. I used `background: card` so the header reads as a distinct surface.

**Why no `title:` on the screen.** The brief asks for a custom header bar, so adding the built-in app bar via `title:` would double up. The custom `layout horizontal` is the only header.

**Title duplication.** The article title appears twice — once in the header bar (compact, `heading.small`) and once at the top of the body (full `heading`). That's intentional: the header version persists as a navigation landmark, while the body version is the document's actual title block, paired with the byline.