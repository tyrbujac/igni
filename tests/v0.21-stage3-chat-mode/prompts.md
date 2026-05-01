# v0.21 persistence + reactive-fetch cancellation — Stage 3 chat-mode ship-validation

**Companion instrument to** `tests/v0.21-stage3/` (API panel, cold-test runner). First dual-instrument Stage 3 ship-validation in the cycle's history. Same 3 prompts as the API panel; same shipped cheatsheet (`spec/v0.21.0-cheatsheet.md`); same ship bar.

**Why dual-instrument.** Cross-instrument convergence is established methodology (n≥4 for persistence's v0.21 inclusion). Chat-mode has been used for cheatsheet quality (n=5: v0.14.1 / v0.15.0 / v0.17.0 / v0.19.1 / v0.20.1) and strategic critique (n=2) but not for Stage 3 ship-validation — that asymmetry has no strong rationale, and `shared persisted:` is brand-new syntax, so cold-write evidence at ship-validation across two instruments validates the Option B choice with stronger evidence than API alone.

## How to run (operator-side, web UIs)

For each model in `{Claude Opus 4.7 (Claude.ai), GPT 5.3 (ChatGPT), Gemini 3.1 Pro (Gemini), Gemini 3 Flash (Gemini)}`:

1. Open a fresh chat in the web UI (no system prompt; no project context; no memory).
2. Paste the **full contents** of `spec/v0.21.0-cheatsheet.md` as the first message.
3. Wait for acknowledgement, then paste **prompt 1** verbatim. Save the response.
4. Open a *separate fresh chat* (don't reuse — independence per prompt). Paste the cheatsheet again. Then paste **prompt 2**. Save.
5. Repeat for **prompt 3** in another fresh chat.
6. Save responses to `tests/v0.21-stage3-chat-mode/<model>.md` with prompt-separator headings:

   ```markdown
   # Stage 3 chat-mode — <model>

   ## P1 — Theme + sender-name settings with persisted preferences

   <pasted response>

   ---

   ## P2 — Live-search with rapidly-changing dependency

   <pasted response>

   ---

   ## P3 — Notes app with persisted draft + sync to remote

   <pasted response>
   ```

   File naming follows v0.20.1-cheatsheet-review precedent: `claude-opus-4-7.md`, `gpt-5.3.md`, `gemini-3.1-pro.md`, `gemini-3-flash.md`.

## Why fresh-chat-per-prompt

API panel runs each prompt as an independent request (no cross-prompt memory). Chat-mode preserves that property by using a fresh chat per prompt — otherwise the second prompt would see the first prompt's output as context, and we'd be measuring "how well does the model carry the first answer's frame into the second" rather than "how does the model independently interpret the cheatsheet for prompt N." Same canonical-cold-read property as the API panel.

**Chat-mode artifact rule:** preserve any minor copy-paste mangling (web UIs occasionally drop punctuation or render ligatures) verbatim — same precedent as v0.20.1-cheatsheet-review's "joy" / "thinkisible" Pro artifacts. Don't clean up the model output; the artifacts are the ground truth.

## Cost + wallclock target

$0 (chat-mode is free for these subscriptions). Wallclock ~30 min (4 models × 3 prompts; ~2 min per prompt for paste + read; longer for Pro / Opus when reasoning runs). Operator-attention only on paste-and-save; no judgement calls during the run.

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
