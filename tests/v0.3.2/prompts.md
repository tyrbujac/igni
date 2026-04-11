# Igni Cold-LLM Test Prompts (v0.3.2)

These are the three prompts that were tested against the **v0.3.2** spec. Their results live in this same folder. Each prompt's "predicted gaps" annotation is from the time it was written; the "status" annotations show how the gaps were addressed in v0.4.

## How to use these prompts

**Paste the full Igni spec FIRST, then paste one of these prompts BELOW it in the same chat message.** The order matters: the prompt has to be the most recent thing the model sees, otherwise the model latches onto the spec and starts discussing it instead of executing the task.

Each prompt ends with a *"Respond with only the Igni code"* directive. Don't remove it — without that line, frontier models default to narrating the spec instead of generating code.

To re-run any of these tests, paste the entire contents of `spec/v0.3.2.md` followed by one of the prompts below, and capture the response into the matching `<App>.md` file in this folder.

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
