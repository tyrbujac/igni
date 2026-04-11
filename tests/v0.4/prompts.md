# Igni Cold-LLM Test Prompts (v0.4)

These are the three prompts being run as **v0.4 acceptance tests**. Chat and Music player were originally drafted for v0.3.2 but never executed; Notes is new and was added to stress-test v0.4's predicted weak point (multi-screen navigation and cross-screen state).

If all three pass cleanly, v0.4 is your stable release.

## How to use these prompts

**Paste the full Igni spec FIRST, then paste one of these prompts BELOW it in the same chat message.** The order matters: the prompt has to be the most recent thing the model sees, otherwise the model latches onto the spec and starts discussing it instead of executing the task.

Each prompt ends with a *"Respond with only the Igni code"* directive. Don't remove it — without that line, frontier models default to narrating the spec instead of generating code.

To run any of these tests, paste the entire contents of `spec/v0.4.md` followed by one of the prompts below, and capture the response into the matching `<App>.md` file in this folder.

---

## 4. Chat interface

> Using only the Igni language spec above, write a chat interface in Igni. The screen should show a list of messages (each with a sender name and message text), have a text input at the bottom for typing new messages, and have a send button that adds the new message to the list and clears the input.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:** lists with custom message components, text input + button, list mutation (append a new message), clearing an input after submit.

**Predicted gaps:** how to clear an input programmatically (no `controller.clear()` in the spec); scroll-to-bottom behaviour (no scroll primitive in the spec).

---

## 5. Music player

> Using only the Igni language spec above, write a music player screen in Igni. Show album art, song title, artist, a progress slider, and play/pause/skip-back/skip-forward buttons in a row at the bottom.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:** image, slider with bind, conditional button (play vs pause), horizontal layout for the controls row, the `icon` primitive.

**Predicted gaps:** none significant. This one is the closest to a v0.4 happy path and was already validated against Gemini in the v0.3.1 comparison test. Use it as the baseline.

---

## 6. Notes app

> Using only the Igni language spec above, write a notes app in Igni. The user should see a list of all their notes (showing just the title) on the main screen, with a button to create a new note. Tapping a note opens a detail screen showing the full content. From the detail screen, the user can edit the note's title and body, save changes, or delete the note. When there are no notes yet, show an empty state on the main screen.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:** **multi-screen navigation** (the first test in the suite that genuinely requires it), list rendering, empty state handling with `is empty`, edit-and-save mutation flow, delete with `without`, and create-new-note flow. Combines list patterns from Todo with the navigation pattern that no previous test exercises.

**Predicted gaps for v0.4:**

- **Cross-screen state.** The notes list lives on the main screen, but the detail screen needs to read and modify it. v0.4 has no shared-store concept (deferred to v0.5). Models will likely either: (a) pass the whole list down as an argument and rebuild via callbacks, (b) invent a global store, (c) find a pattern using existing primitives.
- **Navigation with state mutation.** When the detail screen deletes or edits a note, how does the list screen reflect the change? Tied to the cross-screen state question.
- **Returning from detail with a result.** The spec only has `navigate to` and `navigate back` with no mention of return values. Models may invent a callback pattern.

This is the **first v0.4 acceptance test that's expected to surface a real gap** (cross-screen state). If models find a clean pattern using existing primitives, v0.4 is more powerful than expected. If they all converge on inventing something, that's the v0.5 design driver.
