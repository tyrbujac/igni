# v0.21 pre-cycle evidence — cold-test prompts

**Stage:** Pre-Stage-1 candidate-cluster cold test (novel cycle pattern, n=1; methodology framing in `README.md`).

**Run command (when ready):**

```
npx tsx tests/runner/cold-test.ts \
  --spec tests/v021-pre-cycle-evidence/cheatsheet-draft-full.md \
  --prompts tests/v021-pre-cycle-evidence/prompts.md \
  --out tests/v021-pre-cycle-evidence \
  --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview,gemini-3-flash \
  --no-grade
```

`--no-grade` because the cheatsheet teaches primitives that don't exist in the v0.20.1 transpiler — auto-grade would falsely fail every output. Manual convergence-counting per `README.md` promotion bars.

**Cheatsheet preparation note:** `cheatsheet-draft.md` in this directory is *additions only*. Before run, generate `cheatsheet-draft-full.md` by concatenating `spec/v0.20.1-cheatsheet.md` body with `cheatsheet-draft.md` additions in their target locations.

**Prompt-design discipline:** prompts use card-sender-shaped surfaces grounded in `docs/private/120` app 3 scope. Each prompt has natural surfaces for **multiple candidates** (not one prompt per candidate) — so cross-candidate convergence is measurable without one prompt curating toward a single shape. Rotation gets natural surfaces in P1 (decorative card stamps) and P3 (tag accents); honest-no demotion measurable across both prompts if cells consistently don't reach for it.

**Selection-bias guard:** prompts are written to be Igni-natural (the way Tyr would describe the screen to a frontier LLM if asking it to write Igni from scratch), not constructed to favour a specific shape. If a model proposes a competing shape that solves the same screen need, that's evidence — log per `README.md` synthesis section.

---

## P1 — Card list home screen with hoverable previews and decorative stamps

> Write Igni source for the home screen of a digital greeting-card-sender app. The screen shows a grid of available card designs the user can pick from. Each card design is a small preview (image background + a title overlay like "Birthday" or "Thank You" in a hand-drawn style) the user can tap to start customising it. Some cards have a "NEW!" stamp in the top-right corner — a small rotated label that's visually distinct from the rest of the card.
>
> When the user hovers over a card with a pointing device (web/desktop), the card visually lifts: subtle shadow appears, background tints toward the brand colour. On mobile (touch only), there's no hover state.
>
> Use a `shared:` block for the list of card designs (sample data — at least 3 entries, ideally 6, with fields like `id`, `title`, `image`, `is_new`). Use `theme:` for the colour palette (warm cream background, soft red accent for stamps, sage green for the "NEW!" highlight). Make the layout responsive — on a wide screen, cards arrange in a row that wraps to multiple lines; on a narrow screen, they stack vertically.
>
> The card image is `image "<filename>"`. Tapping a card calls `pick_card(card)`. The function isn't shown — assume it navigates to the customiser.

**What this prompt natively benefits from:**
- `hover:` (load-bearing on the card lift behaviour)
- `layout stack:` (load-bearing on the corner stamp placement)
- `layout horizontal, wrap: true:` (load-bearing on the responsive grid)
- `rotation:` (natural for the "NEW!" stamp; if the model omits it the operator's honest-no prior is supported)

---

## P2 — Card preview screen with floating share button and overlay watermark

> Write Igni source for a card preview screen in the same app. The screen shows the picked card design at full size — image background fills the screen, title and message render on top of the image. In the bottom-right corner, a circular "Share" button floats over the card content (always visible, doesn't scroll with the card).
>
> Across the diagonal of the card, a subtle "PREVIEW" watermark renders at low contrast — diagonal text, large enough to read but not so opaque it obscures the card. The watermark only appears in preview mode (`shared.preview_mode` is true); when the user taps "Send", they navigate to the send screen and the watermark is gone.
>
> Use the customiser's existing `shared.picked_card` for the card data (don't re-fetch). The Share button calls `share_card()`. Background tap navigates back to the customiser.

**What this prompt natively benefits from:**
- `layout stack:` (load-bearing — image base + title overlay + share button + watermark all at the same position)
- `rotation:` (natural for the diagonal watermark — if model uses `rotation: 45` they'd be writing free-angle which the cheatsheet rejects; if they use `rotation: 90` or omit, that's measurable)
- `hover:` (natural on the share button for desktop; not load-bearing)

---

## P3 — Filter screen with chip-group tag filter and inline previews

> Write Igni source for a filter screen in the same app. The user has a list of tags (occasion: birthday, thank-you, holiday, get-well, congrats, sympathy, generic — 7 tags). The screen shows these as a chip group at the top: each chip is a small rounded label (`#birthday`, `#thank-you`, etc.) the user can tap to toggle. Selected chips highlight with brand colour; unselected chips show on the subtle background.
>
> The chip group flows horizontally across the screen — when there are too many chips for one row, they wrap to the next row at the same alignment.
>
> Below the chip group, a list of card designs filtered by the active tag selection. Use the same card-data shape as P1's `shared.cards` (`id`, `title`, `image`, `tags` — list of strings). Filter logic: if no chips are selected, show all cards. If any chips are selected, show cards whose `tags` intersect the selection.
>
> Each card in the filtered list shows a small inline preview (image + title + tag badges). When hovered (web/desktop), the preview expands slightly to show extra detail (the card's full description text). On mobile (touch), the preview always shows the basic info; tapping navigates to the customiser.

**What this prompt natively benefits from:**
- `wrap: true` (load-bearing on the chip group flowing to multiple rows)
- `hover:` (load-bearing on the preview expansion)
- `layout stack:` (natural for the inline preview's tag badges over the image)

---

## Per-prompt scoring (synthesis-time)

For each cell × prompt, log:

| Field | Value |
|---|---|
| Hover used | Y/N + shape reached for |
| Stack used | Y/N + shape reached for |
| Wrap used | Y/N + shape reached for |
| Rotation used | Y/N + shape reached for |
| Competing shapes proposed | Free-text, if any |
| Honest-no flag for rotation | Surfaced or omitted |

Aggregate per candidate across all 12 cells (4 models × 3 prompts):

- ≥9/12 reach for shape ⇒ strong promote
- 6-8/12 reach ⇒ partial promote (Stage 1 design note opens with refinement signal)
- 3-5/12 reach ⇒ revisit (mixed signal; possibly the proposed shape is wrong, not the candidate)
- ≤2/12 reach ⇒ demote to permanent Ideas

Cross-tabulate with prompt-level reach: if a candidate gets 4/4 on the prompt where it's load-bearing but 0/4 on prompts where it's natural-but-not-load-bearing, that's strong promote (cells use it when it solves the problem, not just because the cheatsheet shows it).
