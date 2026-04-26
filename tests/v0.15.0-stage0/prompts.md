# v0.15.0 `theme: color:` — Stage 0 cheatsheet cold-test

Post-ship cold-test against `spec/v0.15.0-cheatsheet.md`. Three pre-registered prompts (locked in `docs/private/98` §Stage 0 cold-test prep, refined post-Stage-2). Run via `tests/runner/cold-test.ts` with `--spec ../../spec/v0.15.0-cheatsheet.md` and `--grade` (transpile auto-validation).

**Pre-registered:**

- **Panel:** 3 frontier models — `claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`. Flash-Lite excluded (Stage 3 includes it as noise tier).
- **Context:** `spec/v0.15.0-cheatsheet.md` (~3,500 words).
- **Ship-bar:** 4/4 P1 + P2 (canonical adoption), 3/4 P3 (no over-declaration). Note: P1/P2/P3 numbering is per-prompt, panel size is 3 here so "4/4" reads as 3/3 for Stage 0 (the cheatsheet panel); Stage 3 widens to 4 models for the same prompts.
- **Stage 0 ship bar:** 3/3 on P1 + P2; 2/3 on P3 (acceptable — open token namespace makes one over-declaration recoverable).
- **Soft-fail:** 2/3 on P1 or P2 → patch cheatsheet language for the missed prompt, re-run that prompt only.
- **Hard-fail:** ≤1/3 on P1 or P2 → reopen the v0.15.0 design (Stage 2 patches insufficient).

---

## 1. Brand override

> Using only the Igni language spec above, build a settings screen with a logout button. Use a custom brand colour `#FF6B35`.
>
> Show the complete Igni code, then briefly explain how the colour gets from the `theme:` declaration to the rendered button.

**What to grade (Stage 0 adoption focus):**

- Does the model declare `theme: color: brand: "#FF6B35"` at the top level? (Hard adoption rule.)
- Does the model use `color: brand` on the button (rather than declaring a new token like `my_brand`)? (The prompt says "custom brand colour" — the canonical move is to override the built-in `brand` token.)
- Does the model avoid inline hex (`color: "#FF6B35"`)?
- Transpile auto-graded by the runner.

---

## 2. Multiple overrides + user-defined tokens

> Using only the Igni language spec above, build a status dashboard with three labels showing different statuses. Use:
>
> - `brand` overridden to `#0066CC`
> - a custom user-defined token `success` with hex `#00AA00`
> - a custom user-defined token `danger_subtle` with hex `#FFEEEE`
>
> Each label uses one of these three colours. Show the complete Igni code.

**What to grade:**

- Does the model declare all three entries in a single `theme: color:` block? (Hard adoption rule — coherent ship.)
- Does the model use `success` and `danger_subtle` as identifiers (not `theme: color: "success": "#X"` or other variants)?
- Does the model avoid declaring `success` or `danger_subtle` outside the `theme: color:` block?
- Does the model use the tokens by name (`color: brand`, `color: success`, `color: danger_subtle`)?
- Transpile auto-graded.

---

## 3. Existing token unchanged (negative test)

> Using only the Igni language spec above, build a card with a subtle background — a simple card showing "Notifications" as a heading and "No new notifications" as a body label below.
>
> Show the complete Igni code.

**What to grade:**

- Does the model use `background: card` (the existing background-only token) for the surface? (Pass.)
- Does the model use `subtle` directly? (Soft pass — `subtle` is a foreground token; the prompt's "subtle background" phrasing might mislead, but the canonical answer is `card` for a card surface.)
- Does the model declare an unnecessary `theme: color:` block? (Anti-pattern — the prompt should not require any theme declaration.)
- Transpile auto-graded.

**Pass criterion:** model produces a working card with `card` or `subtle` background AND does NOT declare a `theme:` block. The negative test catches over-eager theme-block declaration on prompts that don't need customisation.

---

## Methodology note

This is a post-ship Stage 0 — the v0.15.0 cheatsheet is shipped, not draft. Stage 0 here measures whether the *teaching* in the shipped cheatsheet is good enough for cold reaches. Stage 3 (separate dir) widens the panel to 4 models against the same prompts.

Pre-registered ship bars locked at design time (`docs/private/98`); revisions to the prompts post-run would invalidate the empirical signal. If a prompt produces unexpected adoption that suggests the prompt itself is unclear, log it as a methodology trap-journal item (not a prompt edit).
