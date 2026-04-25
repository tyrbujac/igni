# v0.13.1 Pomodonut — real-app coverage cold test

Cold test against v0.13.1 cheatsheet. Paste the full cheatsheet FIRST, then the prompt BELOW it. Fresh conversation, no prior context.

**Hypothesis under test — real-app coverage:**

Can frontier LLMs zero-shot build a real personal-use pomodoro app from the v0.13.1 cheatsheet alone? This is criterion-4 real-app #2 (after mum's tutorial-driven app). Closest methodology precedent: panel-89 / mum-test, not Stage 3 (no specific spec feature is being tested for adoption).

**Pre-registered (locked 2026-04-26 in `docs/private/94_pomodonut_real_app.md`):**

- **Panel:** 4 frontier models — `claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview`.
- **Context:** `spec/v0.13.1-cheatsheet.md`.
- **Pass bar (Strong):** ≥2/4 produce a transpilable, browser-functional pomodoro that runs without source-level edits.
- **Pass bar (Soft):** 1/4 transpilable + dogfood-fixable to working in <30 min.
- **Fail bar:** 0/4 transpilable. Reopen design — Pomodonut is wrongly-scoped or the timer-tick gap is genuinely blocking.

**Critical unknown:** Igni has no documented timer/interval primitive. Models will need to invent or hit a wall. If 4/4 fail at "decrement every second," that's v0.14 `every Ns:` promotion signal — but DO NOT ship the spec change from this session.

---

## 1. Pomodonut

> Using only the Igni language spec above, write a pomodoro timer app called Pomodonut. The app helps the user focus by alternating work and break segments.
>
> **Behaviour:**
> - The user starts a 25-minute work segment. When it ends, a 5-minute break segment starts. Cycles continue indefinitely until the user stops.
> - The user can start, pause, and reset the current segment.
> - On segment transition (work→break, or break→work), play a "ding" sound (`play("ding.wav")`).
>
> **Main screen:**
> - Title showing the current segment ("Work" or "Break").
> - Large countdown display showing remaining time as `mm:ss`.
> - A "Start" / "Pause" button (toggles based on running state).
> - A "Reset" button.
> - A "Settings" button that navigates to a settings screen.
> - Use label colour to distinguish work mode (e.g. red/brand) from break mode (e.g. green).
>
> **Settings screen:**
> - Adjust work duration (in minutes). Default 25.
> - Adjust break duration (in minutes). Default 5.
> - Toggle sound on/off.
> - "Back" button (or use `navigate back`) to return.
> - Settings persist back to the main screen via `shared:` state.
>
> **Constraints — DO NOT include:**
> - Canvas drawings, custom graphics, or animations beyond label colour change.
> - OS notifications or foreground services.
> - Vibration.
> - Fireworks / celebration screens.
> - Statistics over time / session history.
>
> Show the complete Igni code first, then briefly explain any design decisions — especially how you implemented the per-second countdown given Igni's primitives.

**What to grade (real-app coverage focus):**

- Does the output transpile? (auto-graded)
- Does the model correctly invent or fail-cleanly at the timer-tick problem?
- Are `shared:` state, `navigate to`, `bind:`, `on tap:`, `play()` used correctly per cheatsheet?
- Does the model avoid the rejected patterns: assignment in UI bodies, mutating shared loop variables, etc?
- Does the model honour the no-canvas/no-notifications constraint, or reach for excluded primitives?
