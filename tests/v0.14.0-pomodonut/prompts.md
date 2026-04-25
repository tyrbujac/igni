# v0.14.0 Pomodonut — real-app rerun (criterion-4 #2 gate)

Rerun of the v0.13.1 Pomodonut cold test against the **shipped v0.14.0 cheatsheet**. Same prompt verbatim; only the cheatsheet has changed (added §Recurrence with `every <duration>:`, `now()` builtin, `on change:` user-input clarification). Measures whether the 0/4 baseline becomes ≥2/4 transpilable + browser-functional now that the timer primitive exists.

Methodology precedent: this is a **real-app coverage rerun**, not Stage 3. The Stage 3 panel (`tests/v0.14.0-stage3/`) already passed 12/12 on focused timer-adoption prompts. This rerun checks whether the timer primitive plus the broader v0.14.0 surface compose into a real shipped app.

**Pre-registered in `docs/private/95_v014_timer_primitive.md` §Pomodonut rerun:**

- **Panel:** 4 frontier models — `claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite-preview`.
- **Context:** `spec/v0.14.0-cheatsheet.md` (the shipped v0.14.0 cheatsheet, not a draft).
- **Strong pass:** ≥2/4 produce a transpilable, browser-functional pomodoro that compiles + runs without source-level edits → ship `transpiler/examples/pomodonut.igni` from best output, **criterion-4 #2 closes**.
- **Soft pass:** 1/4 transpilable + dogfood-fixable to working in <30 min → ship as criterion-4 #2 with documented refinements.
- **Fail bar:** 0/4 transpilable → criterion-4 slot stays open. Likely cause: orthogonal gap (probably `bind: shared.X` in settings screen) compounds. Document and plan v0.14.x transpiler patch.

**Predicted carry-forward gap:** `bind: shared.X` field-access bind. Surfaced 3/4 in the original Pomodonut cold test (claude-opus on slider, gpt-5.5 + gemini-pro on toggle). Stage 0 + Stage 3 didn't exercise it because no settings screen. The Pomodonut rerun will surface it again. If it blocks, that's compounding 7/10 → 8/11 effective signal for a v0.14.x transpiler patch (or a cheatsheet language nudge teaching the canonical local-var-plus-on-change-writeback pattern).

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

**What to grade (criterion-4 #2 gate):**

- Does the output transpile? (auto-graded)
- Does the model use `every <duration>:` + `now()` for the countdown (the shipped v0.14 path)?
- Does the model wire segment transitions correctly (work→break→work cycle)?
- Does the `play("ding.wav")` call fire on segment transition?
- Does the settings screen wire `shared:` state correctly? (Carry-forward `bind: shared.X` gap test.)
- Does the model honour the no-canvas/no-notifications constraint?
- **Browser-functional check (manual)**: pick the best transpilable output, `igni run` from `/tmp/pd2/`, verify timer counts down, segment transitions fire, sound plays, settings reachable + editable.
