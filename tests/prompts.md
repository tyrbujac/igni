# Igni Cold-LLM Test Prompts

These are the six prompts used in the cold-LLM test suite.

## How to use these prompts

**Paste the full Igni spec FIRST, then paste one of these prompts BELOW it in the same chat message.** The order matters: the prompt has to be the most recent thing the model sees, otherwise the model latches onto the spec and starts discussing it instead of executing the task.

Each prompt ends with a *"Respond with only the Igni code"* directive. Don't remove it — without that line, frontier models default to narrating the spec instead of generating code.

Your final chat message should look like this:

```text
[entire contents of spec/v0.4.md, all ~430 lines]

---

[one of the prompts below, including the "Respond with only the Igni code" line]
```

Send. Capture the response into the matching `Cold_Test_<App>_v<spec_version>.md` file.

---

## 1. Calculator

> Using only the Igni language spec above, write a basic four-function calculator in Igni. It should have a display showing the current value, digit buttons 0-9, operator buttons (+, -, ×, ÷), an equals button, and a clear button.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:** state mutation, event handlers, nested horizontal/vertical layouts, screen-internal functions for the calculation logic.

**Predicted gaps (v0.3.2):** comparison operators (`==`, `!=`); number-vs-string distinction (display is a string but math needs numbers); possibly grid layout (a 4×4 button grid is currently 4 nested horizontal layouts).

**Status against v0.4:** v0.4 added `is X` for equality, arithmetic operators `-`/`*`/`/`, and operator precedence — closing all the calculator gaps surfaced in v0.3.2 testing.

---

## 2. Todo list

> Using only the Igni language spec above, write a todo list app in Igni. The user should be able to type a new todo into a text input, add it to the list with a button, see all todos in a list, mark each one as complete (with a visual indication), and delete items they no longer need.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:** lists, two-way binding for the input, list mutation (add and remove), per-item state (completion).

**Predicted gaps (v0.3.2):** list mutation syntax (is it `posts.add(item)`? `posts = posts + [item]`? something else?); possibly filter/find for delete-by-id.

**Status against v0.4:** v0.4 added `+` for list concatenation, `without(list, item)` for removal, `each` in non-rendering contexts, and committed to functional list updates — closing the Todo gaps from v0.3.2 testing.

---

## 3. Weather app

> Using only the Igni language spec above, write a weather app in Igni. The app should fetch the current weather for a city from an API endpoint, show a loading state while fetching, show an error state if the request fails, and display the city name, current temperature, weather description, and an icon for the conditions when the data loads. The user should be able to type a different city name and refresh.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this exercises:** async fetch (the v0.3 strength), loading/error/loaded states, an input + button to trigger a re-fetch.

**Predicted gaps (v0.3.2):** how to re-trigger a `fetch` when an input changes — the spec doesn't show this pattern; possibly query param composition.

**Status against v0.4:** v0.3.2 testing showed the reactive re-fetch pattern was discoverable (2/3 models found it cold), so v0.4 added an explicit example to the Async Data section. Also added `null` and `is null` for the "no value yet" sentinel that Claude reached for.

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
