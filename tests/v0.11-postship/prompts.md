# Igni Cold-LLM Test Prompts (v0.11 post-ship — Clima rerun)

Post-ship validation of v0.11.0: re-run the v0.10 Clima prompt against the v0.11.0 cheatsheet (which now teaches `locate()` + the extended reactive-fetch footgun). The prompt text is **identical** to `tests/v0.10/prompts.md` #5 — the only variable between this rerun and the original Clima round is the cheatsheet. Pre-registration: `docs/private/55_v11_postship_clima_prereg.md`.

**Predictions locked** (from the pre-reg, 2026-04-19):

- 3/3 frontier models will use `locate()` cleanly (Shape A mirroring `fetch()`).
- 0–1/3 frontier models will trip the new extended footgun rule (cheatsheet now has the 3-line trigger-variable fix example).
- Gemma will continue to drift.

**Panel:** Claude Opus 4.7, GPT-5.4, Gemini 3.1 Pro Preview, Gemini 3.1 Flash-Lite Preview. Run **with grading** (not `--no-grade`) — headline metric is transpile-pass, and the transpiler now implements `locate()` (A2.1 lands before this round).

---

## 1. Clima (weather app — geolocation + async + three-screen)

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

**What to grade (per docs/private/55 headline metrics):**

- **`locate()` adoption (Y/N per model).** Did the model use `locate()` cleanly, or invent an alternative (`get_location()`, `device_latitude()`, `gps()`, etc.)? Target: 3/3 frontier adoption.
- **Reactive-fetch footgun trip rate (Y/N per model).** Did the transpiler reject the model's code for concatenating `here.latitude` / `.longitude` directly into a fetch URL? Target: 0–1/3 frontier trips. A trip means the model didn't internalise the trigger-variable pattern from the v0.11.0 cheatsheet's new example.
- **Transpile-pass rate.** Graded by the runner. Target: 3/3 frontier (Gemma drift expected).
- **Shape invention check.** Any frontier model reaching for Shape B (split functions) or Shape C (device namespace) despite the cheatsheet teaching `locate()`? If yes, that's a docs-teaching signal.

**Context tier:** cheatsheet (`spec/v0.11.0-cheatsheet.md`). Same tier as the v0.10 Clima round — the only variable between the two is the cheatsheet's content.
