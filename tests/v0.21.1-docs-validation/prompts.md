# v0.21 persistence + reactive-fetch cancellation — Stage 0 cold-test

Pre-implementation cold test for the v0.21 bundle: persistence (`shared persisted:` annotated-block, post-Stage-2-FLIP from Option A wrapper-builtin per `docs/private/126`) + reactive-fetch cancellation (Shape C+B counter-token + `http.Client.close()`, post-Stage-2-FLIP from Shape A URL-guard per `docs/private/121`). Cheatsheet draft (`cheatsheet-draft.md`) injected as `--spec`. Both Stage 2 patches inlined: Q4 parse-time-collision rule, Q5 JSON-literal-only rule, race-conditions callout updated to v0.21 cancellation semantics.

**Pre-registered ship bar (mirror v0.19 + v0.20 shape):**

- **Strong:** 3/3 P1 + 3/3 P2 reach for the canonical syntax — `shared persisted:` block with JSON-literal defaults (P1); reactive `fetch()` with rapid-change dependency, no manual cancellation hack (P2). ≥2/3 P3 use `shared persisted:` for the durable surface AND don't reach for cancellation primitives (cancellation is internal; not user-visible).
- **Soft:** 2/3 P1+P2 — patch the cheatsheet draft (teaching needs to be sharper on the divergent point), re-run.
- **Fail:** ≤1/3 P1 — design wrong, reopen Q2 design (back to wrapper-builtin or top-level `persist:` block).

Run with `--no-grade`. v0.21 transpiler hasn't shipped yet; auto-grade would falsely fail every output.

Run via cold-test wrapper:

```bash
npx tsx tests/runner/cold-test.ts \
  --prompts tests/v0.21-stage0/prompts.md \
  --out tests/v0.21-stage0 \
  --spec tests/v0.21-stage0/cheatsheet-draft.md \
  --no-grade \
  --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview
```

Outputs land as `<model>_cheatsheet_<prompt-slug>.{md,json}`. Cost target: ~$0.40 (3 models × 3 prompts; cheatsheet ~7800 words; mirrors v0.20's $0.83 but with smaller spec injection).

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
