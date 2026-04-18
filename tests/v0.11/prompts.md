# Igni Cold-LLM Test Prompts (v0.11 — Clima, async + geolocation + networking)

Cold tests against `spec/v0.10.0-cheatsheet.md`. Paste the full cheatsheet FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

**What this validates:** whether frontier models can express an app that needs (a) device geolocation, (b) async network fetches against a real response shape, (c) auto-fetch on screen appear, and (d) three-screen coordination with a value popped back from a child screen. Geolocation and auto-fetch-on-appear are features current Igni does not support; the expected finding is a prioritised list of transpiler gaps for v0.11, not a clean-transpile result.

**Hypothesis under test:**

With the current spec (`fetch` works, `navigate to` + `navigate back` with params works, `is loading:` / `is error:` exist), which features do frontier models invent to fill the gaps? How much overlap across models — is there a convergent shape the spec could adopt?

**Panel:** Claude Opus 4.7, GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama). Same panel as v0.10. Full pre-registration in `docs/private/48_v11_clima_prereg.md`.

---

## 1. Clima (weather app — geolocation, async, JSON, three screens)

> Using only the Igni language spec above, write a weather app in Igni with the behaviours below.
>
> **On launch:** the app gets the user's current device location (latitude and longitude) and immediately fetches the weather for that location from the OpenWeatherMap API. Show a loading indicator while the fetch is in flight. When the data arrives, switch to a weather screen.
>
> **Weather screen:** shows the current temperature (rounded to an integer, in degrees Celsius, followed by a `°` symbol), an emoji for the current weather condition, the city name, and a short personalised message about the temperature. The screen has two buttons:
>
> - a **current-location** button that re-fetches weather using the device's current latitude and longitude;
> - a **search-by-city** button that opens a separate city-search screen.
>
> **City-search screen:** has a text input for a city name and a "Get Weather" button. Tapping "Get Weather" returns the user to the weather screen, which then shows the weather for the typed city. A back action on the city-search screen returns to the weather screen without changing anything.
>
> **OpenWeatherMap API (use these exact facts, don't invent):**
>
> - Endpoint: `https://api.openweathermap.org/data/2.5/weather`
> - Query by coordinates: append `?lat=<latitude>&lon=<longitude>&appid=<api_key>&units=metric`
> - Query by city name: append `?q=<city>&appid=<api_key>&units=metric`
> - The API key is a string value available to you as `api_key` — assume it's already configured; don't worry about how it got there.
> - The response JSON contains (among other fields): `main.temp` (a number, temperature in Celsius), `weather` (a list whose first entry has an integer field `id` in the range 200–800+), and `name` (a string, the city name).
>
> **Condition-code → emoji** (use exactly these buckets on the `id` integer):
>
> - `id < 300` → 🌩
> - `id < 400` → 🌧
> - `id < 600` → ☔️
> - `id < 700` → ☃️
> - `id < 800` → 🌫
> - `id = 800` → ☀️
> - `id <= 804` → ☁️
> - otherwise → 🤷
>
> **Temperature → message** (use exactly these buckets on the integer Celsius temperature):
>
> - `temp > 25` → `"It's 🍦 time"`
> - `temp > 20` → `"Time for shorts and 👕"`
> - `temp < 10` → `"You'll need 🧣 and 🧤"`
> - otherwise → `"Bring a 🧥 just in case"`
>
> Display the message with the city name naturally (e.g. `"It's 🍦 time in London!"`) — any readable arrangement is fine.
>
> Don't worry about visual polish, fonts, background images, platform permissions, or API-key storage. Focus on the Igni code expressing the app's logic, state, and screen flow. If Igni can't express something cleanly, write it in the shape you'd want the language to support and note what you'd need the language to add.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What to grade:**

- **Geolocation shape.** How did the model express "get the device's current location"? Expected shape families: (a) `location()` builtin returning coords, (b) `location.latitude` / `location.longitude` accessors, (c) a `coords:` property or `geolocation:` block, (d) a fake `fetch` to a location service, (e) honest `# GAP:` comment. Record the exact syntax.
- **Lifecycle-hook shape.** How did the model express "run this when the weather screen appears"? Expected shape families: (a) `on appear:` / `on load:` / `on start:` event, (b) screen-body statement that relies on lexical reactivity to auto-run at mount, (c) a button-gated fallback that requires the user to tap to trigger the first load, (d) `fetch` assigned at screen top that implicitly triggers on first render.
- **Navigation flow.** `navigate to` + `navigate back` with params? Did the city-search screen pop the typed city back and trigger a re-fetch in the weather screen, or did it fetch + display in-place? Note which.
- **JSON access.** Did the model use Igni dot access (`response.main.temp`) or invent bracket notation (`response["main"]["temp"]`)? Did it handle `weather[0].id` (indexed-then-dot) cleanly via the spec's `list[index]`?
- **Async pattern.** `is loading:` / `is error:` usage. How is the `fetch` URL built — string concatenation (`"..." + api_key`) or interpolation (not in spec — drift signal)? Does the reactive-fetch footgun rule (v0.9.0 transpile error) fire? Models shouldn't bind `fetch` to a user-input field.
- **Shared vs local state.** Weather data held in `shared:` (cross-screen) or local screen state passed as navigation param? Either is defensible; note which and why.
- **Condition/temp lookups.** `if`/`else if` chains (expected — Igni has no `match`/`case`) or a screen-internal function? Helper-function extraction is a style signal, not a spec signal.
- **Honest "no".** Models that refuse to invent and leave `# GAP: need geolocation primitive` (or similar) are the most diagnostically useful outputs — exactly what the v0.11 backlog needs.
- **Transpile pass.** Auto-graded by the runner. Expected low for frontier models: geolocation and lifecycle-hook are known gaps. Code that transpiles should be inspected — did the model honestly degrade the feature set (hardcoded lat/lon, tap-only for Get Location) to stay inside the language, or did it invent syntax the transpiler accidentally accepts?

**Success bar:** no single-number bar. This is a coverage test, not an adoption test. The useful outcome is a ranked backlog of transpiler gaps by overlap across models. Minimum bar: 2/3 frontier models must surface *something* on geolocation (invention or honest-no) for the gap to count as evidence.

**Context tier:** cheatsheet (`spec/v0.10.0-cheatsheet.md`). Matches v0.10 cadence — same teaching surface.
