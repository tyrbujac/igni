# v0.22 hover + size tokens — Stage 3 ship-validation

Post-implementation cold test against the v0.22-content cheatsheet (`spec/v0.21.2-cheatsheet.md`, ~8800 words — the working cheatsheet that already carries the v0.22 §Hover section and the extended Spacing-tokens table; will be archived as `spec/v0.21.2-cheatsheet.md` and forked to `spec/v0.22.0-cheatsheet.md` at the version-bump session post-Stage-3).

Same three prompts as Stage 0 (`tests/v0.22-stage0/prompts.md`) re-run against a 4-model panel (3 frontier + flash-lite noise tier) to confirm the cheatsheet teaches the post-implementation surface. Stage 0 cleared its bar (8/9 PASS-mod-bench after the `not-allowed` → `not_allowed` lexer-clean rename); Stage 3 verifies that the *same* teaching survives panel-ranked canonical reach when noise-tier teaching surfaces are in scope.

**Why post-implementation Stage 3.** Stage 0 was 3-model × 3-prompt (cheatsheet-only reach test). Stage 3 widens to 4 cells per prompt and adds flash-lite noise tier — surfaces differential teaching signal (smaller-model differential patterns reproduced n=3 per `docs/private/130`). Discipline differs from Stage 0: Stage 3 is graded on canonical adoption, not transpilability (the transpiler now compiles the full surface — 165 fixtures green; smoke 104/107 with 3 pre-existing SMOKE_SKIPs unchanged).

**Pre-registered ship bar** (mirrors v0.19 / v0.20 / v0.21 Stage 3 shape, 4-cell × 3-prompt):

- **Strong:** 4/4 P1 + 4/4 P2 + ≥3/4 P3 reach for canonical syntax — `hover:` sub-block for property overrides (P1+P2), `is_hovered()` inside `if` for conditional content (P2 explicitly), `rounded: full` for circular avatar AND pill button (P3), `cursor: not_allowed` inside `hover:` for disabled state (P3), `gap: none` for tight packing (P1+P3). Proceed to ship-confirmation; close v0.22 cycle.
- **Soft:** 3/4 on P1 or P2 — log as Tier-A patch for v0.22.0 ship narrative or v0.22.1 docs iteration (no spec-level reopen).
- **Fail:** ≤2/4 P1 — reopen cheatsheet teaching; possible v0.22.x design re-open (Q1-shape `hover:` sub-block or `is_hovered()` lexical-scope rule).

Run with `--no-grade` per v0.19 / v0.20 / v0.21 precedent. Auto-grade against panel output introduces churn (canonical-shape variation across cells doesn't represent bugs).

Run via cold-test wrapper:

```bash
npx tsx tests/runner/cold-test.ts \
  --prompts /Users/tyrbujac/Documents/Projects/experiments/Igni/tests/v0.22-stage3/prompts.md \
  --out /Users/tyrbujac/Documents/Projects/experiments/Igni/tests/v0.22-stage3 \
  --spec /Users/tyrbujac/Documents/Projects/experiments/Igni/spec/v0.21.2-cheatsheet.md \
  --no-grade \
  --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview,gemini-3.1-flash-lite-preview
```

Outputs land as `<model>_cheatsheet_<prompt-slug>.{md,json}`. **Cost target: ~$0.70-1.00** (4 models × 3 prompts; cheatsheet ~8800 words; mirrors v0.21's $0.98 — per-provider cache assumption broke for OpenAI in n=4 prior cycles, so total may skew toward $1.00). Cumulative v0.22 cycle cost projection: $0 (Stage 2 chat-mode) + $0 (Stage 0 size-tokens chat-mode) + ~$0.30 (Stage 0 hover+size-tokens API at 9 cells per `tests/v0.22-stage0/`) + Stage 3 = **~$1.00 - $1.30 projected**.

---

## 1. Card grid with hover-lift

> Build a 3-column grid of recipe cards. Each card has a header image, a title, and a small icon row (favourite, share, more) underneath. On pointer hover, the card visually lifts: its background shifts from `card` to `brand`, a `medium` shadow appears, and the cursor turns to `pointer`. The recipe icon row stays tightly packed — no extra gap between icons. Use realistic recipe data (3 recipes is fine).
>
> Author canonical Igni from the cheatsheet. Don't invent syntax not in the spec.

---

## 2. Card list with hover-revealed preview

> Build a vertical list of book cards. Each card shows the cover image and title by default; when the user hovers a card, a one-line preview description appears below the title (hidden when not hovered). The card itself also subtly highlights — `background: brand` on hover. Use realistic book data (3-4 books).
>
> Author canonical Igni from the cheatsheet. Don't invent syntax not in the spec.

---

## 3. Contact card with pill button, circular avatar, disabled state

> Build a contact card with three regions:
> 1. A circular avatar image at the top (use `rounded: full` for the circle).
> 2. The contact's name and role below the avatar.
> 3. A row of two buttons: a pill-shaped "Follow" button (`rounded: full` + brand background) and a "Message" button. If the contact is already followed, the Follow button shows as disabled — its cursor turns to `not_allowed` on hover and its background becomes `subtle`.
>
> The button row should sit tight against the name (`gap: none` between the name section and the button row). Use realistic contact data.
>
> Author canonical Igni from the cheatsheet. Don't invent syntax not in the spec.
