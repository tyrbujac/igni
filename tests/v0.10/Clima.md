# Clima — v0.11 coverage cold test, 4-model panel

**Date:** 2026-04-18
**Pre-registration:** `docs/private/48_v11_clima_prereg.md` (frozen 2026-04-18)
**Prompt:** `tests/v0.10/prompts.md` #5
**Spec tier:** cheatsheet (`spec/v0.10.0-cheatsheet.md`, 1971 words)
**Panel:** Opus 4.7, GPT-5.4, Gemini 3 Flash preview, Gemma 4 E4B
**Runner:** `tests/runner/run.ts`, outputs under `tests/v0.10/outputs/*clima*`

---

## Headline

- **3/3 frontier models independently invented a geolocation primitive. Three shape families, no convergence.** Primary prediction from #48 lands; v0.11 spec work needs a pre-ship cold test to pick between the shapes, same template as v0.10 object-update.
- **1/3 frontier invented an explicit lifecycle hook (Gemini: `on launch:`); 2/3 relied on lexical reactivity at screen-body level.** Secondary prediction partially supported — less convergent than geolocation.
- **Transpile-pass numbers are not informative this round.** 2/4 failures are transpiler JS-heap OOM bugs on valid-looking model code (Opus, Gemini). 1/4 is the runner fence-miss bug from #45 (GPT). 1/4 is floor-model drift (Gemma). Separate v0.11 hygiene work.

---

## Claude Opus 4.7

**Stats:** 1020 in / 1997 out tokens · $0.087 · 23.5s · **transpile ❌ (transpiler OOM, not model)** · 156 lines · 4 screens (Loading, Weather, CitySearch, WeatherByCity).

| Axis                  | Invented? | Shape / observation                                                                           |
|-----------------------|-----------|-----------------------------------------------------------------------------------------------|
| Geolocation           | YES       | `get_location()` returning an async-shaped value supporting `is loading:` / `is error:` — same shape as `fetch`. Structurally coherent with existing spec. |
| Lifecycle hook        | NO (workaround) | Screen-body statement `location = get_location()` relies on lexical reactivity to auto-run at mount. |
| Fetch + URL build     | NO        | `fetch("..." + shared.location.latitude + ...)` at screen-body level. No footgun trigger.     |
| JSON access           | NO        | `weather.main.temp`, `weather.weather[0].id`, `weather.name`. Clean dot + list-index compound. |
| Navigation            | NO        | `navigate to Loading`, `navigate to WeatherByCity city`. No `navigate back` used at all.       |
| State placement       | NO        | `shared:` block for `api_key`, `location`, `weather`. Also writes undeclared `shared.weather_override_city` (line 80) — minor bug. |
| Condition/temp lookup | NO        | Screen-internal helpers `emoji_for(id)`, `message_for(temp)`, `round_int(t)`. **Duplicated across Weather and WeatherByCity** — flagged in footer as a language gap. |
| `shared.` prefix      | NO (clean) | Consistent `shared.X` at all read/write sites. **Closes the #47 domain-coupling watch-metric: Opus did NOT drop the prefix on a weather-domain prompt.** |

**Honest-no footer (strongest of the round):** 20+ line `# --- Notes on what Igni would need to express this cleanly ---` block flagging four distinct gaps: (1) missing geolocation primitive (explicitly assumed as fetch-shaped); (2) `round()` returns string, no numeric rounding for comparisons; (3) no cross-screen function sharing, forced duplication; (4) reactive-fetch footgun drove the two-weather-screen split. This is the diagnostic gold standard for cold tests — the model named the gaps rather than inventing around them silently.

**Transpile failure root cause:** Transpiler entered a JS heap OOM during code generation on this 156-line input. Not a model-output issue; the `.igni` looks well-formed on eyeball. Separate v0.11 transpiler-hygiene investigation.

---

## GPT-5.4

**Stats:** 4229 in / 851 out tokens · $0.023 · 10.3s · **transpile ❌ (runner fence-miss, not model)** · 104 lines · 3 screens (Launch, Weather, CitySearch).

| Axis                  | Invented? | Shape / observation                                                                           |
|-----------------------|-----------|-----------------------------------------------------------------------------------------------|
| Geolocation           | YES       | `device_latitude()` and `device_longitude()` as **two separate builtins**. Different family from Opus's single-function shape. |
| Lifecycle hook        | NO (workaround) | Screen-body statements auto-run via reactivity. No explicit `on appear:` equivalent.     |
| Fetch + URL build     | NO        | String concat. `fetch(shared.weather_url)` where `weather_url` is set in CitySearch's `on tap:` handler, then read reactively in Weather. Novel cross-screen state-machine pattern. |
| JSON access           | NO        | `weather_data.main.temp`, `weather_data.weather[0].id`, `weather_data.name`. Clean.            |
| Navigation            | NO        | `navigate to Weather weather` (positional param), `navigate to CitySearch`, `navigate back` from CitySearch after mutating `shared.weather_url`. Single Weather screen. |
| State placement       | NO        | Mixed: `shared:` for cross-screen mutation channel (`weather_url`, `selected_city`); local for Launch-screen transient state. |
| Condition/temp lookup | NO        | Inlined `if/else if` chains in screen body. Also defines `round_number(value): return value` — a no-op stub; minor correctness bug. |
| `shared.` prefix      | NO (clean) | `shared.weather_url` consistently prefixed. **Also closes #47 watch-metric for GPT.**           |

**Honest-no:** None. GPT used `device_latitude()` / `device_longitude()` silently without flagging that they don't exist in the spec. Less diagnostic than Opus's footer.

**Transpile failure root cause:** GPT emitted the code block without surrounding ```` ```igni ```` fences. Runner's `extractFencedCode()` returns 0 lines. Known bug — flagged in `docs/private/45_v10_domain_swap_results.md` follow-up #2. Code transpiles fine when fenced manually (spot-checked; content is valid Igni).

---

## Gemini 3 Flash preview

**Stats:** 4539 in / 799 out tokens · $0.005 · 4.3s · **transpile ❌ (transpiler OOM, not model)** · 88 lines · 3 screens (Launch, Weather, Search).

| Axis                  | Invented? | Shape / observation                                                                           |
|-----------------------|-----------|-----------------------------------------------------------------------------------------------|
| Geolocation           | YES       | `device.latitude` / `device.longitude` as **namespace-accessor fields on a `device` object**. Third family, different from Opus (function) and GPT (split functions). Explicitly flagged: `# Igni doesn't explicitly define a "get location" builtin, so assuming a standard device utility exists.` |
| Lifecycle hook        | **YES — explicit** | `on launch:` inside the Launch screen. The one model that invented the hook rather than relying on reactivity. Exact shape: `on launch:` with an indented block that mutates state and calls `navigate to`. |
| Fetch + URL build     | NO        | Builds URL in screen body via conditional assignment, then `data = fetch(url)`. No footgun.   |
| JSON access           | NO        | `data.main.temp`, `data.weather[0].id`, `data.name`. Clean.                                    |
| Navigation            | NO        | `navigate to Weather(lat, lon, city_name)` (positional args). `navigate to Search()` — **parenthesised call, slight spec drift**. No `navigate back`; uses `navigate to Weather(0, 0, query)` from Search's submit to round-trip. |
| State placement       | **No `shared:` at all** | Everything passed via screen constructor params. Gemini avoided shared state entirely.        |
| Condition/temp lookup | NO        | Screen-internal `get_emoji(id)` and `get_message(temp)` functions. Single Weather screen, no duplication. |
| `shared.` prefix      | N/A       | No shared state — axis doesn't apply.                                                         |

**Honest-no:** Partial. One comment on the geolocation gap at the top of Launch screen; no comment on the lifecycle invention (since `on launch:` felt natural to Gemini).

**Transpile failure root cause:** Transpiler JS heap OOM, same bug as Opus. 88 lines is the smallest input to trigger the OOM so far — the bug isn't strictly size-dependent.

---

## Gemma 4 E4B (floor — not counted toward frontier signal)

**Stats:** 4096 in / 1683 out tokens · $0 (local) · 151.7s · **transpile ❌ (semicolon syntax error, line 4)** · 213 lines · 0 screens, 1 `component` + 6 auxiliary "components".

Complete Igni drift. The output is recognisably not-Igni at every level:

- Fence: ```` ```ni ```` instead of ```` ```igni ````.
- Braces everywhere: `component WeatherApp { ... }`, `componentState { ... }`, `init { ... }`.
- Semicolons after every statement: `currentCity: String = "London";`.
- Type annotations inline: `String`, `Boolean`, `Int`, `Float`, `Array<Component>`, `WeatherData?`.
- `type WeatherData { ... }` — type declarations.
- `async fetchWeather(...) : WeatherData?` — async keyword + return-type annotation + await.
- String interpolation: `"${currentData.temp}°C"`.
- Invented render primitives: `view { ... }`, `row(...)`, `column(...)`, `card { ... }`, `searchBar(...)`, `text(...)`.
- Mocked weather data by string-matching on city name — no real HTTP at all.
- Trailing JS literals: `new Promise(resolve => setTimeout(resolve, ms))`.

| Axis                  | Invented? | Shape / observation                                                                           |
|-----------------------|-----------|-----------------------------------------------------------------------------------------------|
| Geolocation           | —         | Not attempted. City-based only, with hardcoded mock data.                                      |
| Lifecycle hook        | YES       | `init { fetchWeather(componentState.currentCity); }` — braces-shaped lifecycle block.         |
| Fetch + URL build     | —         | No real fetch. `delay(1000)` placeholder + baked-in `if city == "london"` branches.           |
| JSON access           | —         | `componentState.currentWeatherData.temp` — accessing hardcoded struct, not JSON.              |
| Navigation            | —         | No screens. Single "component" tree; search handled via `handleCitySearch` handler in place. |
| State placement       | —         | `componentState { ... }` block — React/Vue-shaped.                                             |
| Condition/temp lookup | —         | Three-case inlined logic inside a `get` method. Not aligned with spec.                         |
| `shared.` prefix      | —         | No shared state concept at all.                                                                |

**Honest-no:** None. Gemma confidently produced non-Igni code with no acknowledgement that the output violates the language.

**Take:** floor behaviour confirmed. Not a frontier data point, but worth logging that the cheatsheet tier alone is insufficient teaching surface for a model at Gemma's scale on an app this complex. Not a signal to change the spec — a signal about where the scale floor sits for cold-test methodology.

---

## Axis-by-axis synthesis across frontier (3 models)

| Axis                  | Frontier signal                                                                   |
|-----------------------|-----------------------------------------------------------------------------------|
| Geolocation           | **3/3 invented, 3 shape families (no convergence).** Single strongest v0.11 candidate. |
| Lifecycle hook        | 1/3 explicit invention (Gemini `on launch:`); 2/3 reactivity workaround. Moderate signal; may be shape-ambiguous enough to warrant docs patch before syntax. |
| Fetch + URL build     | 3/3 clean. Existing `fetch` + string concat covers the case.                      |
| JSON access           | 3/3 clean dot-access including `weather[0].id` compound. No bracket invention.    |
| Navigation            | Mixed: 2/3 used `navigate to` with params cleanly; 1 used `navigate back`; 1 split into duplicate screens to avoid footgun. |
| State placement       | 1/3 `shared:`-centric (Opus), 1/3 mixed (GPT), 1/3 avoided shared entirely (Gemini). No convergence; spec already accepts all three. Not a gap. |
| Condition/temp lookup | 2/3 helper functions, 1/3 inlined. All used `if/else if` chains as expected. Not a gap. |
| `shared.` prefix      | 2/2 frontier models that used `shared:` held the prefix. **#47 domain-coupling hypothesis weakened:** Opus did not drop the prefix on a further-from-shopping domain. |

Unpredicted observations:
- Opus **duplicated screen-internal helpers** across Weather and WeatherByCity — language-level "cross-screen pure helpers" gap, not previously surfaced.
- Opus **wrote to an undeclared `shared.weather_override_city`** — minor spec-drift, the shared-prefix validator (commit `6c1596a`) rejects bare access but doesn't require declaration. Worth a second validator rule.
- GPT's `fetch(shared.weather_url)` **read-then-reactive-refetch when another screen mutates the shared URL** is a novel cross-screen state-machine pattern. Not a gap — worth noting as an emerging idiom for `fetch` across screens.
- Gemini's `navigate to Search()` **parenthesised invocation** is a drift from the no-parens-on-component-invocation rule. Single-model, single-use — monitor but not a pattern yet.

Grading complete. Summary + ranked v0.11 backlog in `docs/private/49_v11_clima_results.md`.
