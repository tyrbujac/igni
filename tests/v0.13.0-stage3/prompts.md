# v0.13.0 Stage 3 validation — `max_width:` adoption

Cold tests against v0.13.1 (max_width prose-patched per spec-critique panel). Paste the full cheatsheet FIRST, then the prompt BELOW it. Fresh conversation, no prior context.

**Hypothesis under test — Stage 3 (behavioural adoption):**

Did the token-first design call (max_width: phone/tablet/desktop, no full token, no numeric values) land? Pre-implementation Stage 0 was deliberately skipped per documented methodology discipline (six prior token primitives all adopted ≥95% on cheatsheet introduction; the seventh would be confirming a near-certainty). Stage 3 measures whether models reach for `max_width:` *unprompted* on prompts whose layouts plausibly need it on a desktop viewport. The pre-implementation 3-model design review (tests/v0.13-design-review/) caught a `full` token slip; the post-ship 3-model spec critique (tests/v0.13.0-spec-critique/) caught three prose ambiguities patched in v0.13.1. Stage 3 is the post-ship behavioural validation against the patched docs.

**Pre-registered (locked 2026-04-22 in `docs/private/79_v013_max_width.md` §Stage 3 attribution):**

- **Panel:** 4 frontier models — `claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview`.
- **Context:** `spec/v0.13.1-cheatsheet.md`.
- **Adoption rule:** A model "adopts" if it reaches for any of `phone` / `tablet` / `desktop` *correctly* in at least one of the two prompts (i.e., on a layout where capping width on a wide desktop viewport would visibly improve the rendering).
- **Pass bar (Shape B token-only holds):** 4/4 adoption. Ship holds. Stage-0-skip prediction vindicated.
- **Soft pass:** 3/4. Note the miss; decide between v0.13.2 docs nudge vs let it ride.
- **Fail bar (Stage-0-skip was wrong):** ≤2/4. Reopen v0.13. Recalibrate the skip rule for future primitives ("six prior token primitives" no longer sufficient warrant).

---

## 1. Multi-column desktop dashboard

> Using only the Igni language spec above, write a desktop analytics dashboard in Igni — a single-screen app intended to run on a wide desktop window (≥1400px wide).
>
> **Screen:**
> - A header bar at the top with the title "Analytics" and a "Refresh" button on the right.
> - Below the header, a three-column layout filling the remaining vertical space:
>   - **Left sidebar (navigation):** four menu items — "Overview", "Traffic", "Conversions", "Revenue". Each is a tappable label.
>   - **Main content area (centre):** three stat cards in a horizontal row. Each card shows a metric name, a large number, and a small caption ("vs last week"). Use `card` background + rounded corners.
>   - **Right sidebar (filters):** three filter controls — a date-range dropdown, a region dropdown, and a "Compare to last period" toggle.
> - The main content area should be the visually dominant column; sidebars should not dominate the screen on a wide monitor.
> - Hardcode the three stat cards' data inside the screen body (no fetch).
>
> Show the complete Igni code first, then briefly explain any design decisions you made — especially around how you sized the three columns so the dashboard reads well on a wide desktop window.

**What to grade (Stage 3 focus — `max_width:` adoption only):**

- Does the model use any `max_width:` token (`phone` / `tablet` / `desktop`) on the sidebars or the main content area?
- Does it correctly avoid `max_width: full` / `none` / `auto` (canonical = omit)?
- If a numeric value is used (e.g. `max_width: 320`), that's a **failure** — the language doesn't accept numerics.
- Transpile auto-graded by the runner.

---

## 2. Long-form article reading view

> Using only the Igni language spec above, write a long-form article reading view in Igni — a single-screen app intended to run on a wide desktop window (≥1400px wide), where the article body should not stretch to the full window width because over-wide text is hard to read.
>
> **Screen:**
> - A header bar at the top with a "Back" button on the left, the article title in the centre, and a "Share" button on the right.
> - Below the header, the article body: a series of paragraphs and a couple of section headings, presented in a comfortable reading width regardless of how wide the window is. The body should be horizontally centred in the remaining window space.
> - Hardcode the article: a title, a byline, two section headings, and 4–6 paragraphs of placeholder body text inside the screen body.
>
> Show the complete Igni code first, then briefly explain any design decisions you made — especially around the article body's width on a wide window.

**What to grade (Stage 3 focus):**

- Does the model use `max_width: tablet` (or `phone`) on the article body? Centred via `align: center` on the parent or the body itself?
- Does it correctly avoid `max_width: full` / `none` / `auto` / numeric values?
- Is the output semantically correct at runtime?
- Transpile auto-graded by the runner.
