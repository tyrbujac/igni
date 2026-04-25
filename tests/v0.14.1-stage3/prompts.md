# v0.14.1 Stage 3 — `bind: shared.X` widening adoption + Pomodonut criterion-4 #2 gate

Post-implementation behavioural cold test against shipped `spec/v0.14.1-cheatsheet.md`. Two prompts: P1 measures the new shape's adoption on a fresh settings-with-shared scenario; P2 reruns the v0.14.0-pomodonut prompt to gate criterion-4 #2 close.

This is **Stage 3** for the v0.14.1 transpiler widening. Stage 2 was intentionally skipped per the methodology argument in `docs/private/96` (the syntax is what 11/14 panel cells already produced — Stage 2 review of "should we accept what models already produce?" is ceremony).

**Pre-registered (locked 2026-04-26 in `docs/private/96` §Stage 3):**

- **Panel:** 4 frontier models — `claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview`.
- **Context:** `spec/v0.14.1-cheatsheet.md`.
- **Pass bar:** **3/4 minimum on P1 + ≥2/4 on P2 transpile-clean.** P1 measures `bind: shared.X` adoption; P2 closes the criterion-4 gate.
- **Soft pass:** 3/4 P1 + 1/4 P2 → ship v0.14.1, criterion-4 #2 stays open until next session.
- **Fail bar:** ≤2/4 P1 → reopen scope. ≤1/4 P2 → criterion-4 #2 stays open and root-cause investigation.

---

## 1. Settings screen with shared state

> Using only the Igni language spec above, write a 2-screen counter app:
>
> **Main screen.** Shows a counter. A "+" button increments by `step` (default 1). A "-" button decrements by `step`. A "Settings" button navigates to the settings screen.
>
> **Settings screen.** Adjust the increment step (slider, range 1-10). Toggle "Sound on tap" (a boolean — when on, the main screen plays a "click.wav" sound on increment). A "Back" button. Settings persist to the main screen via `shared:` state.
>
> Show the complete Igni code first, then briefly explain how the settings persist across screens.

**What to grade (Stage 3 adoption focus):**

- Does the model use `slider bind: shared.step` or `toggle bind: shared.sound_on` directly? (Hard adoption rule — pass requires using the new shape.)
- Does the model avoid the local-var-plus-`on change:`-writeback workaround? (The cheatsheet explicitly notes this is no longer needed.)
- Does the model wire `shared:` correctly with the right initial values?
- Transpile auto-graded.

---

## 2. Pomodonut

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

**What to grade (criterion-4 #2 gate):**

- Does the output transpile? (auto-graded — this is the hard gate)
- Does the model use `every <duration>:` + `now()` for the countdown (the v0.14 path)?
- Does the model use `bind: shared.X` for the settings sliders/toggle (the v0.14.1 path)?
- Does the model wire segment transitions correctly (work→break→work cycle)?
- Does the `play("ding.wav")` call fire on segment transition?
- Does the model honour the no-canvas/no-notifications constraint?
