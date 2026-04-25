# v0.14 timer primitive — Stage 0 cheatsheet review

Pre-implementation cold test. Three prompts measuring whether frontier models adopt `every <duration>:` correctly given the v0.14.0-cheatsheet draft (with §Recurrence + `now()` + `on change:` clarification). Run via `tests/runner/cold-test.ts`. Paste the cheatsheet draft FIRST as `--spec`, then prompts as a sequence. Fresh conversation, no prior context.

**Pre-registered (locked 2026-04-26 in `docs/private/95_v014_timer_primitive.md` §Stage 0):**

- **Panel:** 3 frontier models — `claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`. Flash-Lite intentionally excluded — known panel-noise on prose-heavy prompts.
- **Context:** `tests/v0.14-stage0/cheatsheet-draft.md`.
- **Ship-bar:** 3/3 adoption on each of three prompts. Total 9 cells must all pass adoption rules.
- **Soft-fail:** 2/3 on any single prompt — patch the cheatsheet language for that prompt's adoption miss, re-run failing prompt only.
- **Hard-fail:** ≤1/3 on any prompt — reopen the relevant Shape question (multi-block? whitelist size? `now()` shape?). Don't proceed to ship.

---

## 1. Countdown timer

> Using only the Igni language spec above, write a 60-second countdown timer. The user starts the timer; remaining time displays as `mm:ss` (e.g. `01:00`, `00:45`); when the timer reaches zero, display "Time's up!" instead of the timer. Provide Start and Reset buttons.
>
> Show the complete Igni code first, then briefly explain how the countdown works — especially how it stays correct if the user navigates away and comes back.

**What to grade (Stage 0 adoption focus):**

- Does the model use `every 1s:` for the periodic recompute? (Hard adoption rule — pass requires this.)
- Does the model use `now()` to capture absolute timestamps and compute remaining time as a delta? (Hard adoption rule — relative `remaining = remaining - 1` decrement is a soft pass with the navigate-away limitation, but the cheatsheet teaches absolute-timestamp as canonical.)
- Does the model correctly handle the "Time's up" branch in render?
- Transpile auto-graded by the runner.

---

## 2. Notes editor with auto-save

> Using only the Igni language spec above, write a notes editor screen. The user types into a text input. The draft auto-saves to a backend every 5 seconds (call `save(draft)` to persist — assume `save` is provided). Below the input, display "Saved Ns ago" (where N is the integer number of seconds since the last save), updated every second.
>
> Show the complete Igni code first, then briefly explain how the two recurring tasks are wired together.

**What to grade:**

- Does the model use **two separate `every` blocks** — one `every 1s:` for the indicator update + one `every 5s:` for the save? (Hard adoption rule — multi-block is the canonical shape.)
- Does the model avoid the modulo-counter workaround inside a single `every 1s:` block?
- Does the model use `now()` for the "Ns ago" calculation?
- Transpile auto-graded.

---

## 3. Live weather display

> Using only the Igni language spec above, write a screen that displays the current weather for London. Fetch from `https://api.example.com/weather?city=London` — assume the response is `{temperature: 15, conditions: "Cloudy"}`. The screen should refresh the data every 30 seconds automatically. Display the temperature and conditions; show a spinner while loading and an error message if the fetch fails.
>
> Show the complete Igni code first, then briefly explain how the periodic refresh is wired.

**What to grade:**

- Does the model use `every 30s:` (Hard adoption rule — pass requires this.)
- Does the model use the canonical `fetch()` + `is loading` / `is error` shape from the cheatsheet?
- **Reporting (not grading):** how does the model compose `every` with `fetch()` to trigger periodic refresh? The cheatsheet doesn't teach this composition explicitly. Categorise observed approaches: trigger-variable in URL, reassignment-of-fetch-result, hallucinated `refetch()` builtin, etc. If 0/3 produce a clean compose, this is itself a Stage 0 finding (integration gap; cheatsheet patch or v0.15 primitive candidate).
- Transpile auto-graded.
