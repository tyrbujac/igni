# v0.14.0 Stage 3 — `every <duration>:` + `now()` adoption

Post-implementation behavioural cold test against the shipped `spec/v0.14.0-cheatsheet.md`. Three prompts measuring whether the panel reaches for `every`, `now()`, and the canonical absolute-timestamp pattern unprompted, *and* whether the transpiler correctly handles what they produce. Run via `tests/runner/cold-test.ts`. Paste cheatsheet via `--spec`. Fresh conversation, no prior context.

This is **Stage 3** in the spec-iteration cycle (`docs/cycle.md`) — post-implementation behavioural validation. Stage 0 (pre-implementation cheatsheet review at `tests/v0.14-stage0/`) hit 9/9 against a 3-frontier panel. Stage 3 includes Flash-Lite to match the realistic frontier set, with a softer ship bar (3/4 min, 4/4 ideal) explicitly accounting for Flash-Lite's documented panel-noise role.

**Pre-registered (locked 2026-04-26 in `docs/private/95_v014_timer_primitive.md` §Stage 3):**

- **Panel:** 4 frontier models — `claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview`.
- **Context:** `spec/v0.14.0-cheatsheet.md`.
- **Adoption rule:** Model uses `every <duration>:` correctly with at least one of the three whitelisted tokens. For the Pomodoro prompt, additionally check that `now()` is used (relative-decrement is a soft-pass with the documented limitation, not a hard miss).
- **Pass bar:** **3/4 minimum (ship holds), 4/4 ideal.** Match v0.11.4-stage3 shape, NOT v0.13's tighter pattern. Flash-Lite is documented panel-noise; setting 4/4 invites a re-roll cycle.
- **Soft pass:** 3/4 with Flash-Lite as the miss → ship, log the miss, no docs nudge unless it correlates with a frontier miss.
- **Soft pass:** 3/4 with a frontier model as the miss → ship, log the miss, v0.14.1 docs nudge candidate.
- **Fail bar:** ≤2/4. Reopen — likely the cheatsheet teaching is wrong. Patch and re-run before reopening Shape.

**Secondary signals to capture (not pass/fail):**

- Adoption rate of the canonical absolute-timestamp Pomodonut pattern (`now() - start_time`) vs the relative-decrement fallback.
- Convergent fetch+every composition pattern — Stage 0 saw 3/3 reach for `data = fetch(...)` reassignment without explicit teaching; check whether Stage 3's Flash-Lite addition holds the same convergence.
- Multi-block adoption rate in P2 — whether models reach for two `every` blocks vs a single block with modulo gating.
- Transpile-failure modes per cell. Likely failure classes: `bind: shared.X` (carry-forward gap from Pomodonut, ROADMAP Stream 3 #4), `format_time()` invented (Stage 0 3/3 pattern; current transpiler doesn't have it), modulo `%`. These are *orthogonal gaps*, not v0.14 adoption misses.

---

## 1. Countdown timer

> Using only the Igni language spec above, write a 60-second countdown timer. The user starts the timer; remaining time displays as `mm:ss` (e.g. `01:00`, `00:45`); when the timer reaches zero, display "Time's up!" instead of the timer. Provide Start and Reset buttons.
>
> Show the complete Igni code first, then briefly explain how the countdown works — especially how it stays correct if the user navigates away and comes back.

**What to grade (Stage 3 adoption focus):**

- Does the model use `every 1s:` for the periodic recompute? (Hard adoption rule — pass requires this.)
- Does the model use `now()` to capture absolute timestamps and compute remaining time as a delta? (Hard adoption rule for canonical pass — relative `remaining = remaining - 1` decrement is a soft pass with the navigate-away limitation, but the cheatsheet teaches absolute-timestamp as canonical.)
- Does the model correctly handle the "Time's up" branch in render?
- Transpile auto-graded by the runner. Failures here may be orthogonal-gap signal, not adoption miss.

---

## 2. Notes editor with auto-save

> Using only the Igni language spec above, write a notes editor screen. The user types into a text input. The draft auto-saves to a backend every 5 seconds (call `save(draft)` to persist — assume `save` is provided). Below the input, display "Saved Ns ago" (where N is the integer number of seconds since the last save), updated every second.
>
> Show the complete Igni code first, then briefly explain how the two recurring tasks are wired together.

**What to grade:**

- Does the model use **two separate `every` blocks** — one `every 1s:` for the indicator update + one `every 5s:` for the save? (Hard adoption rule — multi-block is the canonical shape per cheatsheet.)
- Does the model avoid the modulo-counter workaround inside a single `every 1s:` block?
- Does the model use `now()` for the "Ns ago" calculation?
- Transpile auto-graded.

---

## 3. Live weather display

> Using only the Igni language spec above, write a screen that displays the current weather for London. Fetch from `https://api.example.com/weather?city=London` — assume the response is `{temperature: 15, conditions: "Cloudy"}`. The screen should refresh the data every 30 seconds automatically. Display the temperature and conditions; show a spinner while loading and an error message if the fetch fails.
>
> Show the complete Igni code first, then briefly explain how the periodic refresh is wired.

**What to grade:**

- Does the model use `every 30s:` to trigger the refresh? (Hard adoption rule.)
- Does the model use the canonical `fetch()` + `is loading` / `is error` shape from the cheatsheet?
- Does the model converge on the `forecast = fetch(...)` reassignment pattern Stage 0 panel found unanimously? Track for any deviation (trigger-variable nonces, hallucinated `refetch()` builtins, etc.).
- Transpile auto-graded.
