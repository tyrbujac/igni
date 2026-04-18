# Igni Cold-LLM Test Prompts (v0.10 — object-update syntax validation)

Cold tests against v0.9.1. Paste the full spec/cheatsheet FIRST, then paste the prompt BELOW it in the same chat message. Fresh conversation, no prior context.

**What this validates:** whether frontier models independently invent an object-update syntax that matches the v0.10 design note's recommended shape (`{target with field: newval}`) vs. alternatives (`{...target, field: newval}`, `update(target, ...)`, method-style). Same template as the v0.7.0 BMI rerun that validated `bg = card` assignability before the spec adopted it.

**Hypothesis under test:**

Given the canonical "update one field on an object in a list" idiom and its verbose field-enumeration form, what shape do frontier models reach for when asked to propose a more concise syntax? Design note (`docs/private/42_v10_object_update.md`) recommends `{target with field: newval}` on principle grounds; this test gauges whether that matches models' natural reach or whether the spread-based `{...target, ...}` wins organically.

**Prediction:** two plausible outcomes —

- **`with`-keyword cluster** (3-4/4 models): validates the design note's recommendation directly. Ship `{target with ...}`.
- **Spread cluster** (3-4/4 models): counter-signal. Reconsider `{...target, ...}` despite the principle-based rejection in the design note.
- **Mixed / no convergence** (split 2/2 or 4 different shapes): ship the design note's recommendation on principles; the cold test didn't produce a strong natural idiom.

**Panel:** Claude Opus 4.7, GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B (local via Ollama). Same panel as v0.9.0 / v0.9.1 Product Search. Run with `--no-grade` — this prompt asks for syntax proposals, not code that transpiles.

---

## 1. Object-update syntax proposal

> Using only the Igni language spec above, look at this function:
>
> ```igni
> toggle_done(target):
>   items = replace(items, target, {text: target.text, done: not target.done})
> ```
>
> And this one:
>
> ```igni
> increment_quantity(existing):
>   shared.cart = replace(shared.cart, existing, {id: existing.id, name: existing.name, price: existing.price, quantity: existing.quantity + 1})
> ```
>
> Both follow the canonical "update one field on an object in a list" idiom documented in the spec: `replace(list, target, new_object)` where `new_object` enumerates every field of `target` plus the change you actually care about.
>
> **Task:** propose a concise Igni syntax for building `new_object` that preserves all of `target`'s fields while overriding one or more. The goal is to eliminate the field-by-field enumeration while staying inside Igni's design principles (indentation over brackets, no method syntax, `{...}` for object literals, one way to do everything, `key: value` is reserved for object literals and component invocation arguments).
>
> Write:
>
> 1. The exact syntax you propose, used to rewrite both functions above.
> 2. A one-paragraph explanation of why you chose that shape over alternatives you considered.
> 3. Any concerns or ambiguities — places where the proposal might collide with existing syntax or would need a tightening rule.

**What to grade:**

- **Shape family.** Which cluster did the model reach for? Options observed across the literature and adjacent languages: (a) `with` keyword inside `{}`, (b) `...` spread inside `{}`, (c) new builtin (`update(target, field: val)`), (d) method-style (`target.update(...)`), (e) something unexpected.
- **Consistency with Igni principles.** Did the model reason about the principles in `CLAUDE.md`-style terms (no brackets, no method syntax, spec budget) or did it drop in a JS/TS idiom without reasoning?
- **Edge case coverage.** Did the model raise the `with`-as-field-name ambiguity, the shallow-vs-deep question, or the base-must-be-Ident concern? These are the real design decisions; a good proposal surfaces them.
- **Spec placement.** Did the model show where in the spec the new rule would live and what the existing "Replacing items" section (line 727–737) would need to say?
- **Design drift.** Any proposals that violate existing non-negotiables (method syntax, ternary-like operators, parens on component invocation, string interpolation)?

**Success bar:** at least 3/4 frontier models converge on a single shape family. The converged shape becomes the v0.10 proposal. If models split across multiple families, ship the design note's `with`-keyword recommendation on principles (rejecting the JS/TS spread import is already a principled stance, not a cold-test-contingent one).

**Context tier:** cheatsheet (`spec/v0.9.1-cheatsheet.md`). Condensed spec is the tightest teaching surface — if the cheatsheet's existing object-literal + `replace` rules are enough for the model to propose a coherent extension, the spec has succeeded at teaching its own shape.

---

## 2. Shopping (post-ship v0.10 `{target with ...}` adoption)

> Using only the Igni language spec above, write a small e-commerce app in Igni. It should have two screens: a product list showing each product's name and price, and a cart screen. Tapping a product adds it to the cart. If the product is already in the cart, its quantity increases by one instead of adding a duplicate row. The cart screen shows items with their name, price, quantity, and a "Remove" button per item. Show a total price at the bottom. Use shared state for the cart.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What to grade:**

- **v0.10 adoption (headline metric).** Did the model use `{target with ...}` for the quantity-increment case (the canonical one-field update on an existing object)? Score ✓ if the model writes `{existing with quantity: existing.quantity + 1}`; ✗ if it falls back to the verbose `{id: existing.id, name: existing.name, ...}` field enumeration. Target: 3-4/4 adoption.
- **Transpile pass.** Auto-graded by the runner. Three frontier models should produce code that transpiles on first attempt.
- **Shared-state usage.** `shared:` block for the cart, `shared.cart = ...` for the mutation, `shared.` prefix at read sites.
- **Identity vs predicate lookup.** `find(cart, item => item.id is product.id)` for the "already in cart?" check — identity match doesn't work across `navigate` transitions since the product is a new object each time.
- **Design drift.** Any invented syntax? Any regression compared to the v0.6.1 Shopping round (dashboard spec example that already tested this prompt shape)?

**Success bar:** at least 3/4 frontier models use `{target with ...}` unprompted for the quantity-increment. The verbose form is still legal but the cheatsheet's prominent example points at the `with` shape first — if the cheatsheet teaches the rule, adoption should be high.

**Context tier:** cheatsheet (`spec/v0.10.0-cheatsheet.md`). Tightest teaching surface; if condensed spec is sufficient, that's the strongest validation of the v0.10 design.

---

## 3. Apothecary (domain-swap control — potion inventory)

> Using only the Igni language spec above, write a small apothecary app in Igni. It should have two screens: a potion shelf showing each potion's name and price, and a satchel screen. Tapping a potion adds it to the satchel. If the potion is already in the satchel, its quantity increases by one instead of adding a duplicate row. The satchel screen shows potions with their name, price, quantity, and a "Discard" button per potion. Show a total price at the bottom. Use shared state for the satchel.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this validates:** structural twin of #2 Shopping. Rules out the "models only adopted `{target with ...}` because shopping carts are over-represented in training data" hypothesis. If adoption holds when the domain is an apothecary/potion shop rather than an e-commerce cart, the signal is about the cheatsheet's teaching, not the domain's training-data density.

**Grading:** identical to #2. Headline metric is `{existing with quantity: existing.quantity + 1}` adoption for the duplicate-add case. Target: 3/3 frontier to match #2.

**Context tier:** cheatsheet (`spec/v0.10.0-cheatsheet.md`).

---

## 4. Spaceship Cargo (domain-swap control — further from shopping)

> Using only the Igni language spec above, write a small spaceship cargo-loading app in Igni. It should have two screens: a cargo catalog showing each cargo item's name and mass, and a hold screen. Tapping a cargo item adds it to the hold. If the cargo is already in the hold, its quantity increases by one instead of adding a duplicate row. The hold screen shows items with their name, mass, quantity, and a "Jettison" button per item. Show a total mass at the bottom. Use shared state for the hold.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

**What this validates:** second domain swap, further from shopping than #3. Mass instead of price, hold instead of cart, jettison instead of remove. Structure preserved. Together with #2 and #3, three runs = evidence (reviewer's framing), not one hopeful result.

**Grading:** identical to #2. Headline is `{existing with quantity: existing.quantity + 1}` adoption. Target: 3/3 frontier.

**Context tier:** cheatsheet (`spec/v0.10.0-cheatsheet.md`).

---

*Prompts 1–4 above validate the v0.10 object-update syntax. Prompt 5 below is a different theme — a coverage probe for the v0.11 backlog, grouped here by spec-version-under-test convention (run against `spec/v0.10.0-cheatsheet.md`, informs v0.11 spec/transpiler work).*

## 5. Clima (weather app — geolocation + async + three-screen)

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

**What this validates:** whether frontier models can express an app that needs device geolocation, async network fetches against a real response shape, auto-fetch on screen appear, and three-screen coordination with a value popped back from a child screen. Geolocation and auto-fetch-on-appear are features current Igni does not support. Expected outcome: a ranked v0.11 transpiler backlog ordered by model-overlap signal, not an adoption-rate number. Full pre-registration in `docs/private/48_v11_clima_prereg.md`.

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
