# Cold-LLM Test: Weather App (Igni v0.3.2)

**Spec version tested:** Igni v0.3.2
**Test run dates:** 2026-04-11 (all three models complete)
**Source prompt:** `prompts.md` → Weather app

## The prompt

> Using only the Igni language spec above, write a weather app in Igni. The app should fetch the current weather for a city from an API endpoint, show a loading state while fetching, show an error state if the request fails, and display the city name, current temperature, weather description, and an icon for the conditions when the data loads. The user should be able to type a different city name and refresh.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Claude

**Model version:** Claude Opus 4.6
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen Weather:
  city = "Liverpool"
  weather = null
  loading = false
  error_msg = null

  layout vertical, gap: medium, padding: large, align: center:
    layout horizontal, gap: small:
      input bind: city, placeholder: "City name"
      button "Search", color: brand, on tap: search()

    if loading:
      spinner
    else if error_msg:
      label error_msg, color: danger
    else if weather is not null:
      icon weather.icon, size: 64, color: brand
      label weather.city, style: heading
      label weather.temperature + "°C", style: heading.small
      label weather.description, style: body, color: subtle

  search():
    loading = true
    error_msg = null
    result = fetch("/api/weather?city=" + city)
    if result is error:
      loading = false
      error_msg = "Couldn't load weather for " + city
      weather = null
    else:
      loading = false
      weather = result
```

### Grading

- **Invented syntax not in the spec?** **Yes — four things:** `null` as a value (used to initialise `weather` and `error_msg`); `is not null` as a check; truthiness coercion of a string variable (`else if error_msg:` treats a non-empty string as a boolean); number-plus-string concatenation (`weather.temperature + "°C"` — the spec doesn't define type coercion for `+`).
- **Used existing syntax wrong?** **Yes — chose the wrong async pattern.** Claude reached for the manual state-machine pattern from the v0.3.2 Mutations example (tracking `loading`, `error_msg`, `weather` as separate variables and mutating them in a function) rather than the simpler declarative reactive pattern that the Async Data section shows for reads (`weather = fetch(...)` at the screen body level, with reactivity re-running it when inputs change). Both patterns "work" but the manual one is much more verbose and reintroduces the imperative state tracking that v0.3.2 was designed to avoid.
- **Valid Igni on first try?** **No.** Multiple inventions plus a missed-the-better-pattern issue.
- **Line count:** ~32 lines.

### Notes

- **Picked the imperative state pattern** — Claude's `search()` function manually mutates `loading`, `error_msg`, and `weather`. This is exactly the structure of the v0.3.2 Mutations example (which is for *saves*, not reads). For a *read*, the spec's earlier Profile example shows the simpler declarative form: `user: User = fetch(...)` at the screen body, with `if user is loading` / `else if user is error` rendering branches. Claude generalised the mutation pattern across both cases and missed that reads are simpler.
- **Reached for `null`** — both `weather = null` and `error_msg = null`. The spec doesn't have `null` as a value. Claude treats it as the "no value yet" sentinel, which is a familiar pattern from many languages.
- **Truthiness coercion** — `else if error_msg:` is the same JS-style boolean coercion ChatGPT did in the calculator and todo. Two different models, two different apps now hitting this — it's a real pattern that v0.4 needs an answer for.
- **Number + string concatenation** — `weather.temperature + "°C"` assumes `+` coerces a number to a string. The spec defines `+` for both string concatenation and numeric addition (Counter example) but doesn't say what happens when one operand is each.

---

## Gemini

**Model version:** Gemini Thinking 3.0 (switched from Pro 3.1 after hitting Pro limits)
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen WeatherApp:
  search_term = "London"
  active_query = "London"
  data = fetch("/api/weather/" + active_query)

  layout vertical, padding: large, gap: medium, align: center:
    layout horizontal, gap: small:
      input bind: search_term, placeholder: "Enter city..."
      button "Check", on tap: active_query = search_term

    if data is loading:
      spinner
    else if data is error:
      layout vertical, gap: small, align: center:
        label "Couldn't find weather for " + active_query, color: danger
        button "Retry", on tap: active_query = search_term
    else:
      layout vertical, gap: medium, align: center:
        label data.city, style: heading
        icon data.icon, size: large, color: brand
        label data.temp + "°", style: heading
        label data.description, style: body, color: subtle
```

### Grading

- **Invented syntax not in the spec?** **One thing:** number-plus-string concatenation (`data.temp + "°"`). Same issue as Claude's `weather.temperature + "°C"`.
- **Used existing syntax wrong?** **No.** This is the cleanest output across all three apps tested so far.
- **Valid Igni on first try?** **Almost yes.** The only invention is the implicit number→string coercion in the `+` expression, which is borderline (the spec defines `+` for both operations but doesn't specify mixing them).
- **Line count:** ~22 lines. The most compact valid-shape Weather of the three.

### Notes

- **Discovered the reactive re-fetch pattern.** This is the most important finding from this entire test. Gemini set up two variables: `search_term` (the input bind) and `active_query` (what the fetch URL depends on). The "Check" button does `active_query = search_term`, which by lexical reactivity causes the screen to re-evaluate from the top, which causes `data = fetch(...)` to re-run with the new query. **No invention. No new feature. Just the existing v0.3.2 reactivity rule applied correctly.** This is exactly what the spec was designed to enable, and Gemini found it cold.
- **Even the retry button uses the same pattern** — `on tap: active_query = search_term` — no new mechanism needed.
- **Used `is loading` / `else if is error`** — the v0.3.2 async state syntax used correctly.
- **Used dynamic icon name from data** — `icon data.icon, size: large, color: brand` — assumes the runtime supports variable icon names. The spec only shows static names like `icon "play"` but variable names should work too.
- **Switched models mid-suite:** Tyr ran out of Gemini Pro 3.1 limits after the Calculator and Todo tests, so this Weather run was on Gemini Thinking 3.0. Worth noting in the cross-test analysis — this is the same vendor but a different model. The result quality is similar (still discovered the right pattern), but it's not strictly the same model as the prior two tests.

---

## GPT

**Model version:** ChatGPT (free tier, model version not displayed)
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen Weather:
  city = "London"
  query = city
  weather = fetch("/api/weather?city=" + query)

  layout vertical, gap: medium, padding: large, align: center:
    layout horizontal, gap: small:
      input bind: city, placeholder: "Enter city"
      button "Refresh", on tap: refresh()

    if weather is loading:
      spinner
    else if weather is error:
      label "Couldn't load weather", color: danger
    else:
      layout vertical, gap: small, align: center:
        label weather.name, style: heading
        icon weather.icon, size: large
        label weather.temperature, style: heading.small
        label weather.description, style: body, color: subtle

  refresh():
    query = city
```

### Grading

- **Invented syntax not in the spec?** **None.** Zero inventions. This is the first 100%-valid-Igni output across all three apps.
- **Used existing syntax wrong?** **No.**
- **Valid Igni on first try?** **Yes.** Clean v0.3.2 throughout.
- **Line count:** ~22 lines.

### Notes

- **Same reactive re-fetch insight as Gemini.** ChatGPT independently arrived at the same two-variable pattern: `city` (the input bind) and `query` (what the fetch URL depends on). The `refresh()` function does `query = city`, which re-triggers the fetch via the lexical reactivity rule. **This is the strongest cross-model agreement in the suite so far** — two different models, two different vendors, both found the same pattern with no help.
- **Used a screen-internal function** for the trigger update rather than inlining the assignment in the `on tap:` (Gemini did `on tap: active_query = search_term` directly). Both forms are valid; ChatGPT's is slightly more verbose but more discoverable for someone scanning the layout.
- **Avoided the number-string concatenation issue** by rendering `weather.temperature` directly via `label` rather than concatenating it with a unit suffix. Cleaner output but loses the unit display.
- **Used `is loading` and `is error`** correctly. Used the v0.3.2 async state syntax exactly as documented.

---

## Gaps observed (across all three models)

This is the cross-model synthesis for the Weather test.

### The cross-model gap matrix (Weather only)

| Gap | Claude Opus 4.6 | Gemini Thinking 3.0 | ChatGPT (free) | Universality |
|---|---|---|---|---|
| `null` value and `is not null` | invented | n/a | n/a | only Claude |
| Truthiness coercion (`else if error_msg:`) | invented | n/a | n/a | only Claude |
| Number + string concatenation | invented (`temperature + "°C"`) | invented (`temp + "°"`) | n/a (avoided) | 2/3 |
| Manual state pattern vs reactive read | manual (verbose) | reactive (clean) | reactive (clean) | 2/3 chose reactive |
| Reactive re-fetch via mutable URL var | missed | **discovered** | **discovered** | 2/3 found the design |

### The headline finding from this test

**The v0.3.2 reactive design works as intended for live-refresh use cases, and it's discoverable.** Both Gemini and ChatGPT independently invented the same pattern with no prompting:

```igni
screen Weather:
  city = "London"           # bound to the input
  query = city              # what the fetch URL depends on
  weather = fetch("/api/weather?city=" + query)   # re-runs when `query` changes

  ...
  button "Refresh", on tap: refresh()   # or directly: on tap: query = city

  refresh():
    query = city            # triggers re-fetch via reactivity
```

The "predicted gap" about how to re-trigger a fetch when an input changes **is not actually a gap.** The existing lexical reactivity rule already handles it. v0.3.2 succeeds at this case.

### The v0.4 documentation finding

But the pattern isn't *fully* obvious — Claude missed it and reached for the manual state-machine pattern from the spec's Mutations example. The fix is documentation, not new features:

**v0.4 should add a one-paragraph example to the Async Data section** showing the reactive re-fetch pattern explicitly. Something like:

> When a `fetch` URL depends on a variable that changes during the screen's lifetime (like a search input), the fetch automatically re-runs each time that variable is reassigned, by the lexical reactivity rule. There's no need to manually track loading/error/weather as separate variables — declare the fetch at the screen body and let reactivity drive the re-fetches.

That's one paragraph, no new syntax, would have caught Claude.

### Genuine gaps surfaced

1. **`null` value and null-check syntax.** Claude reached for `null` as the "no value yet" sentinel and `is not null` as the check. **The spec doesn't have `null` at all.** v0.4 needs to either:
   - Bless `null` as a value and add `is null` / `is not null` (extends the existing `is X` pattern naturally)
   - Or commit to "no null in Igni — use sensible defaults like `""`, `0`, `[]`, and the `is empty` pattern for absence checks"
   
   The first is more familiar, the second is more on-brand for the spec's minimalism. Worth a design call.

2. **Number + string concatenation behaviour is undefined.** Both Gemini (`data.temp + "°"`) and Claude (`weather.temperature + "°C"`) assumed `+` coerces a number to a string when used in a mixed expression. The spec defines `+` for numeric addition (Counter example) and string concatenation (Variables section) but doesn't specify mixed-type behaviour. **v0.4 fix:** one sentence in the Variables section — *"When `+` is used between a number and a string, the number is converted to its string representation."* This blesses the existing model behaviour without adding any new syntax.

3. **Truthiness coercion (3rd app, 2nd model)** — Claude wrote `else if error_msg:` to test a string variable as a boolean. ChatGPT did the same in Calculator (`if operator:`) and Todo (`color: todo.done and subtle`). **This is now a multi-model, multi-app pattern.** Already on the v0.4 list as a stop-note.

### Predicted gaps that did NOT surface

- **"How to re-trigger a fetch when an input changes"** — predicted as a gap, but 2/3 models found the pattern from existing features. **Removed from the v0.4 backlog.** The spec succeeds here; only docs need a tweak.
- **Query param composition** — predicted as a gap, but all three models just used string concatenation (`"/api/weather?city=" + query` or similar). The spec's `+` for strings handled this fine. Not a gap.

---

## Combined Calculator + Todo + Weather findings

Three apps tested. Patterns are now strong enough to commit decisions on.

### Universal across all tested apps

- **The `is X` extension for arbitrary equality** — Calculator (2/3 chose `is`), Todo (2/3 chose `is`), Weather (n/a — equality wasn't needed here, but Claude used `is not null` extending the pattern further). **4/6 data points across two apps.** Slam dunk for v0.4.

### Strong cross-app patterns

- **Truthiness coercion** — ChatGPT/Calculator (`if operator:`), ChatGPT/Todo (`color: x and y`), Claude/Weather (`else if error_msg:`). **3 apps, 2 models, 3 forms.** v0.4 needs an explicit stop-note.
- **Number/string interactions** — Calculator (Claude needed `to_number`/`to_string`), Weather (Gemini and Claude both wrote `number + "°"`). The cheap fix is one sentence in v0.4: "primitives auto-render numbers as strings, and `+` between a number and a string converts the number to its string representation." Resolves both findings.

### Confirmed v0.3.2 design wins

- **Reactive read pattern** (Weather, 2/3) — works as designed for live-refresh use cases. No new feature needed. Spec docs could add an example.
- **`is loading` / `is error`** (every app that needed async) — used correctly by every model that needed it.
- **Functions inside screens close over state** (every app) — used correctly by every model.
- **`if` / `else if` / `else` chains** (every app) — used correctly by every model.

### Updated v0.4 backlog

After three apps, the backlog is:

1. **Arithmetic operators `-`, `*`, `/`** (Calculator universal)
2. **Operator precedence rule**, one sentence (Calculator universal)
3. **Bless `is X` for arbitrary equality** (Calculator + Todo, strongest evidence in suite — 4/6)
4. **Bless `+` for list concatenation** (Todo universal)
5. **Define the canonical list removal pattern** (Todo universal need; design call deferred until Chat app)
6. **Decide on `each` in non-rendering context** (Todo, 2/3)
7. **One-line: list item field mutation rule** (Claude/Todo)
8. **One-line: cross-component function calls allowed** (Claude/Todo)
9. **One-line: no truthiness coercion** (ChatGPT/Calculator + ChatGPT/Todo + Claude/Weather — now 3 data points)
10. **One-line: primitives auto-render numbers + `+` coerces number to string in mixed expressions** (Claude/Calculator + Gemini/Weather + Claude/Weather)
11. **`null` design call** (Claude/Weather — bless `null` and `is null`/`is not null`, OR commit to no-null with sensible defaults)
12. **Reactive re-fetch documentation** (Weather — add a one-paragraph example to the Async Data section showing how `fetch` URLs depending on mutable variables auto-re-run; no new feature, just docs)

**That's 6 operators/operations + 6 clarifying notes/docs from three apps.** Spec budget impact stays small.

The biggest open design questions are **#5 (list removal)** and **#11 (`null`)**. List removal waits for Chat data. Null might need a separate design discussion since it's a fundamental data model question.

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni, with `# GAP:` comments where you hit walls. This is the "design by trying" data point — your gaps and the LLMs' gaps should mostly overlap.

```igni
(paste your hand-written attempt here)
```
