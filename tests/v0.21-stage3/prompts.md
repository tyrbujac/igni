# v0.21 persistence + reactive-fetch cancellation — Stage 3 ship-validation

Post-implementation cold test against the shipped cheatsheet (`spec/v0.21.0-cheatsheet.md`, 7300 words). Same three prompts as Stage 0 (`tests/v0.21-stage0/prompts.md`) run against a 4-model panel (3 frontier + flash-lite noise tier) to confirm the shipped cheatsheet teaches the post-implementation surface.

**Why post-implementation Stage 3.** Stage 0 cleared its bar (8/9 canonical, 1 truncated cell) against the cheatsheet *draft*. Stage 3 runs the same prompts against the SHIPPED cheatsheet (the same content the v0.21 user will read) to confirm canonical adoption holds post-implementation. Any teaching-gap findings can land in the v0.21.0 ship's CHANGELOG/ROADMAP narrative or trigger a focused v0.21.1 docs iteration. **Discipline differs from Stage 0:** Stage 3 is a 4-model panel (adds flash-lite noise tier) rather than 3 to surface differential teaching signal; outputs are graded on canonical adoption, not transpilability.

**Pre-registered ship bar** (mirrors v0.19 / v0.20 Stage 3 shape):

- **Strong:** 4/4 P1 + 4/4 P2 reach for canonical syntax (`shared persisted:` annotated-block with JSON-literal defaults; reactive `fetch()` with rapid-change dependency, no manual cancellation primitive). ≥3/4 P3 use `shared persisted:` for the durable surface AND reach for the trigger-variable pattern for the input-bound-to-fetch pitfall AND don't redeclare persisted defaults at runtime. Proceed to ship-confirmation; close v0.21 cycle.
- **Soft:** 3/4 on P1 or P2 — log as Tier-A patch for v0.21.0 ship narrative or v0.21.1 docs iteration (no spec-level reopen).
- **Fail:** ≤2/4 P1 — reopen cheatsheet teaching; possible v0.21.x design re-open (Q2 shape or Q5 literal-only rule).

Run with `--no-grade` per v0.19 / v0.20 precedent. The v0.21 transpiler now compiles the full surface (147 fixtures green; smoke 92/97 — 5 SMOKE_SKIP unchanged); auto-grade against panel output would introduce churn (canonical-shape variation across cells doesn't represent bugs).

Run via cold-test wrapper:

```bash
npx tsx tests/runner/cold-test.ts \
  --prompts /Users/tyrbujac/Documents/Projects/experiments/Igni/tests/v0.21-stage3/prompts.md \
  --out /Users/tyrbujac/Documents/Projects/experiments/Igni/tests/v0.21-stage3 \
  --spec /Users/tyrbujac/Documents/Projects/experiments/Igni/spec/v0.21.0-cheatsheet.md \
  --no-grade \
  --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview,gemini-3.1-flash-lite-preview
```

Outputs land as `<model>_cheatsheet_<prompt-slug>.{md,json}`. **Cost target: ~$0.60-$0.80** (4 models × 3 prompts; cheatsheet ~7300 words; mirrors v0.20's $0.72 — flash-lite adds ~$0.02 per cell at 4×3 = 12 cells; per-provider caching applies to Anthropic + OpenAI but not Google). Cumulative v0.21 cycle cost: $0.35 (Stage 2) + $0.95 (Stage 0) + Stage 3 = **~$1.90 - $2.10** projected (slightly above v0.20's $1.85 cumulative).

---

## 1. Theme + sender-name settings with persisted preferences

> Build a `Settings` screen for a personal greeting-card-sender app. The screen lets the user toggle three theme states (follow-OS, force-light, force-dark) and edit a default sender name that pre-fills on every card. Both preferences must persist across app restarts — closing and reopening the app should preserve the user's choices.
>
> Constraints:
>
> - The app has at minimum: `brand`, `surface`, `text`, `card` colour tokens declared in `theme:`. Dark variant overrides at least `surface`, `text`, `card`.
> - Theme mode and sender name are user preferences; both must survive app close.
> - The Settings screen has a `title:` of "Settings" so the AppBar appears.
> - The theme-mode picker is three radio-button-style options (one per state); the active option is visibly selected.
> - The sender-name input is a single-line text field with a placeholder "Your name on sent cards".
>
> Write `Settings.igni` (the full app — `theme:` + `theme dark:` + persisted-state declarations + `Settings` screen). Use idiomatic Igni per the cheatsheet. If two equally-canonical shapes exist for any decision, pick one and explain briefly.

---

## 2. Live-search with rapidly-changing dependency

> Build a `Search` screen for a recipes app. The screen has a single search input bound to `query`, and a slider that filters results by max-prep-time (in minutes, range 5-120, step 5). Both the query and the slider value are live dependencies of a single `fetch()` call to `https://api.recipes.example/search?q=<query>&max_minutes=<minutes>`. Results render as a vertical list of recipe cards (title + prep-time + brief description).
>
> Constraints:
>
> - The slider drag fires the fetch on every value change (no manual debouncing).
> - The text input fires the fetch only on submit (`on submit:`), not on every keystroke — per the cheatsheet's input-bind-fetch trigger-variable pattern.
> - The screen must handle three states: loading (show a spinner with "Searching..."), error (show "Search failed — tap to retry" with a retry button), and success (show the result list).
> - When the slider drags rapidly, the user should see the latest result, not stale results from earlier fetches mid-drag.
> - The screen has `title: "Find a recipe"` for the AppBar.
>
> Write `Search.igni` (the full app — `theme:` + `Search` screen). Use idiomatic Igni per the cheatsheet. If two equally-canonical shapes exist for any decision, pick one and explain briefly.

---

## 3. Notes app with persisted draft + sync to remote

> Build a `Notes` app with two screens: `List` (top-level, shows persisted notes) and `Editor` (lets the user write a new note). The notes list and the in-progress draft must both persist across app restart — if the user closes the app mid-draft, the draft survives. When the user taps "Save" in Editor, the note is appended to the local list AND POSTed to `https://api.notes.example/sync` to back up.
>
> Constraints:
>
> - `shared persisted:` for the notes list (`[]` initial) and the in-progress draft (`""` initial).
> - `List` screen shows notes as a vertical list of cards (each shows the note text). Empty state: "No notes yet". A "+ New" button navigates to Editor.
> - `Editor` screen has a multi-line input bound to the draft + a "Save" button. Saving: append the draft to `shared.notes`, fire the sync POST, navigate back to List.
> - The sync POST has loading/error/success states — the user sees a spinner during the POST and an inline "Saved!" or "Sync failed" status after.
> - Both screens have AppBar titles ("Notes", "New note").
>
> Write `Notes.igni` (the full app — `theme:` + persisted-state + `List` screen + `Editor` screen). Use idiomatic Igni per the cheatsheet. If two equally-canonical shapes exist for any decision, pick one and explain briefly.
