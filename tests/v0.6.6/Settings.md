# Settings Cold Test Results

**Date:** 2026-04-13
**Models tested:** Claude Opus 4.6, ChatGPT 5.3, Gemini 3.1 Fast, Gemini 3.1 Pro
**Input:** v0.6.6.md (full spec, post-doc-fixes)
**App:** Settings — single-screen settings page with dependent dropdowns, input primitives

## What Settings tests

Focused test for features the Destini and Contacts tests didn't exercise:

- **`on change:`** (country dropdown resets city — requires side effect, not just reactivity)
- **`heading.small`** (section headings, explicitly prompted as "smaller heading style")
- **`dropdown bind:` + `options:`** (two dropdowns, one dependent on the other)
- **`toggle bind:`** (dark mode, notifications)
- **`slider bind:` + `min:` + `max:`** (text size)
- **`checkbox bind:`** (remember me)
- **`image` + `round: true`** (avatar)
- **`button` + `color: danger`** (logout)
- **`divider`** (section separators — undocumented beyond primitives table)

## Results — 4/4 correct, three architectural approaches to dependent dropdowns

### Claude Opus 4.6 — reactive city computation

```igni
screen Settings:
  country = "UK"
  city = ""

  cities = ["London", "Manchester", "Liverpool"]
  if country is "US":
    cities = ["New York", "San Francisco", "Chicago"]
  else if country is "France":
    cities = ["Paris", "Lyon", "Marseille"]
  else if country is "Germany":
    cities = ["Berlin", "Munich", "Hamburg"]

  layout vertical, gap: large, padding: large:
    label "Settings", style: heading

    layout vertical, gap: medium:
      label "Profile", style: heading.small
      image "avatar.png", size: 80, round: true
      label name, style: body
      label email, style: body, color: subtle

    divider

    layout vertical, gap: medium:
      label "Location", style: heading.small
      dropdown bind: country, options: ["UK", "US", "France", "Germany"], on change: reset_city()
      dropdown bind: city, options: cities

    # ... Preferences, Account sections ...

  reset_city():
    city = ""
```

**Reactive approach.** `cities` is computed via conditional assignment at screen body level — when `country` changes, the screen re-evaluates and `cities` is recomputed automatically. `on change:` only needs to reset `city` to empty. Cleanest separation of concerns: reactivity handles the dependent data, `on change:` handles the side effect (clearing stale selection).

Uses `divider` between sections. Wraps each section in its own `layout vertical, gap: medium:`. Profile stacked vertically (not horizontal). All primitives correct.

### ChatGPT 5.3 — imperative update with named city lists

```igni
screen Settings, title: "Settings":
  country = "UK"
  city = ""
  countries = ["UK", "US", "France", "Germany"]

  cities_uk = ["London", "Manchester", "Liverpool"]
  cities_us = ["New York", "Los Angeles", "Chicago"]
  cities_fr = ["Paris", "Lyon", "Marseille"]
  cities_de = ["Berlin", "Munich", "Hamburg"]

  available_cities = cities_uk

  layout vertical, gap: large, padding: large:
    label "Profile", style: heading.small
    layout horizontal, gap: medium, align: center:
      image "avatar.png", size: 64, round: true
      layout vertical:
        label name, style: body
        label email, style: body, color: subtle

    label "Location", style: heading.small
    dropdown bind: country, options: countries, on change: update_country()
    dropdown bind: city, options: available_cities

    # ... Preferences, Account sections ...

  update_country():
    city = ""
    if country is "UK":
      available_cities = cities_uk
    else if country is "US":
      available_cities = cities_us
    else if country is "France":
      available_cities = cities_fr
    else if country is "Germany":
      available_cities = cities_de
```

**Imperative approach.** City lists stored as separate named variables. `on change:` handler resets city AND swaps `available_cities` imperatively. More verbose than Opus's reactive approach but explicit — you can see exactly what happens when the country changes.

`title: "Settings"` app bar. Profile uses `layout horizontal` for avatar + text side-by-side. No `divider` between sections — uses section headings directly inside the main layout. All primitives correct. `logout()` function stubs behaviour without inventing navigation.

### Gemini 3.1 Fast — function return for city options

```igni
screen Settings:
  selected_country = "UK"
  selected_city = ""

  layout vertical, gap: large, padding: large:
    label "Settings", style: heading

    layout vertical, gap: small:
      label "Location", style: heading.small
      label "Country", style: caption
      dropdown bind: selected_country, options: ["UK", "US", "France", "Germany"], on change: reset_city()
      label "City", style: caption
      dropdown bind: selected_city, options: get_cities()

    # ... Profile, Preferences, Account sections ...

  reset_city():
    selected_city = ""

  get_cities():
    if selected_country is "UK":
      return ["London", "Manchester", "Bristol"]
    else if selected_country is "US":
      return ["New York", "Los Angeles", "Chicago"]
    else if selected_country is "France":
      return ["Paris", "Lyon", "Marseille"]
    else if selected_country is "Germany":
      return ["Berlin", "Munich", "Hamburg"]
    return []
```

**Function return approach.** Passes `get_cities()` as the `options:` value — the function is called during screen evaluation and returns the correct list for the current country. Reactive by composition: when `selected_country` changes, the screen re-evaluates, `get_cities()` is called again, returns the new list.

Most architecturally interesting pattern. Uses `caption` labels before each dropdown ("Country", "City"). `divider` between sections. `label "Text Size (" + font_size + ")"` — live slider value display, smart unprompted addition. Profile uses horizontal layout. All primitives correct.

### Gemini 3.1 Pro — imperative update, nesting-conscious layout

```igni
screen Settings, title: "Settings":
  countries = ["UK", "US", "France", "Germany"]
  country = "UK"
  cities = ["London", "Manchester", "Edinburgh"]
  city = null

  layout vertical, padding: large, gap: large:
    label "Profile", style: heading.small
    layout horizontal, gap: medium, align: center:
      image "avatar.png", size: 64, round: true
      layout vertical:
        label name, style: body
        label email, style: caption, color: subtle

    divider

    label "Location", style: heading.small
    dropdown bind: country, options: countries, on change: update_cities()
    dropdown bind: city, options: cities

    divider

    label "Preferences", style: heading.small
    toggle bind: dark_mode, label: "Dark mode"
    toggle bind: notifications, label: "Notifications"
    slider bind: text_size, min: 12, max: 24

    divider

    label "Account", style: heading.small
    checkbox bind: remember_me, label: "Remember me"
    button "Log out", color: danger, on tap: logout()

  update_cities():
    city = null
    if country is "UK":
      cities = ["London", "Manchester", "Edinburgh"]
    # ... other countries ...
```

**Imperative approach.** Same pattern as ChatGPT but updates `cities` directly instead of via a named intermediate. Uses `null` for city reset instead of `""` — semantically "no selection" vs "empty string."

**Nesting-conscious layout.** Explicitly placed section content directly in the main layout (no wrapper `layout vertical` per section) to stay within the 4-level nesting limit — noted in design commentary. `divider` between sections. Profile uses horizontal layout. `title:` app bar. Design commentary claims `bind:` updates the variable before `on change:` fires — an assumption about event ordering not documented in the spec.

## Feature grading

| Feature | Opus | ChatGPT | Gemini Fast | Gemini Pro |
|---|---|---|---|---|
| `heading.small` for sections | **4/4** | **4/4** | **4/4** | **4/4** |
| `on change:` on dropdown | Correct | Correct | Correct | Correct |
| `dropdown bind:` + `options:` | Correct | Correct | Correct | Correct |
| `toggle bind:` | Correct | Correct | Correct | Correct |
| `slider bind:` + `min:` + `max:` | Correct | Correct | Correct | Correct |
| `checkbox bind:` | Correct | Correct | Correct | Correct |
| `image` + `round: true` | Correct | Correct | Correct | Correct |
| `button` + `color: danger` | Correct | Correct | Correct | Correct |
| `divider` | Used | Not used | Used | Used |
| Code errors | None | None | None | None |

**4/4 models, 0 errors, all features correct.** First cold test with a perfect score across all models.

## `heading.small` validation

**4/4 correct.** The prompt said "smaller heading style (not full-size headings)" and all four models used `heading.small`. Compare with Contacts where only 1/4 used `heading.small` for section headings (the prompt said "section headings" without the "smaller" hint). The explicit "smaller heading style" phrasing was the difference — the `heading.small` spec documentation works when prompted clearly.

## `on change:` validation

**4/4 correct.** All models used `on change:` on the country dropdown and correctly identified that it's needed for the city reset side effect. Three distinct approaches to the dependent data:

| Model | City list approach | `on change:` does |
|---|---|---|
| Opus | Reactive conditional assignment at screen body level | Resets city only |
| ChatGPT | Named city list variables, swapped imperatively | Resets city + swaps available_cities |
| Gemini Fast | `get_cities()` function called in `options:` | Resets city only |
| Gemini Pro | Cities list swapped imperatively | Resets city + swaps cities |

Opus and Gemini Fast use reactivity for the dependent data — `on change:` only handles the side effect (clearing stale city). ChatGPT and Gemini Pro do everything imperatively in the handler. Both approaches are valid Igni. Opus's is the most idiomatic (uses reactivity where possible, `on change:` only for what reactivity can't do).

## `divider` usage

**3/4 used `divider`** despite minimal spec documentation (one-line table entry, no examples). Models treated it as self-evident — a horizontal line between sections. No model tried to add properties (`color:`, `thickness:`, etc.). The minimal documentation was sufficient for this use case.

## Gaps surfaced

### 1. `bind:` → `on change:` event ordering undocumented

Gemini Pro's design commentary explicitly states: "Because `bind:` auto-updates the `country` variable *before* the `on change` event resolves, the function can confidently evaluate `if country is...`." All four models assume this ordering (they read the new `country` value inside the handler), but the spec doesn't document it. If the ordering were reversed (handler fires with old value), all four outputs would break.

This is a spec clarification, not a language gap — the assumed ordering is correct and matches every reactive UI framework. One sentence in the `on change:` documentation would prevent ambiguity.

### 2. No new language gaps

Every feature worked. `on change:`, `heading.small`, `dropdown`, `toggle`, `slider`, `checkbox`, `image round:`, `button color: danger`, `divider` — all used correctly by all models. The spec covers this complexity level cleanly.

## Design commentary analysis

Useful findings from the commentary:

- **Opus:** Cleanest architectural reasoning — reactivity for dependent data, `on change:` only for side effects
- **ChatGPT:** Explicit about why everything is local state (single screen, no shared state needed)
- **Gemini Fast:** Noted the slider label as a live-updating display — unprompted addition that demonstrates reactivity understanding
- **Gemini Pro:** Nesting budget awareness — explicitly managed depth to stay within 4 levels. Also surfaced the `bind:`/`on change:` ordering question
