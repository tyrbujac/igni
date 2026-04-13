# Destini Cold Test Results

**Date:** 2026-04-13
**Models tested:** Claude Opus 4.6, Gemini 3.1 Pro, Gemini 3.1 Fast, ChatGPT 5.3
**Input:** Two rounds — cheatsheet-only (v0.6.6-cheatsheet.md) and full spec (v0.6.6.md, post-doc-fixes)
**App:** Destini — choose-your-own-adventure story game (Angela Yu Flutter Course)

## What Destini tests

First app with **branching logic** — not linear progression (Quizzler) but a tree of choices where your path depends on previous decisions. Also tests:
- Data-driven architecture (story nodes as objects with next-node indices)
- Conditional button visibility (endings have one button, branches have two)
- Dynamic button text (labels change per story node)
- List indexing with complex field access (`stories[index].text`, `stories[index].choice1`)
- Background image

No new transpiler features needed — everything was already built.

## Results — 3 distinct architectures

### Gemini 3.1 Fast — data-driven with null sentinel (4 seconds)

```igni
stories = [
  {text: "...", choice1: "...", next1: 2, choice2: "...", next2: 1},
  # ...
  {text: "...", choice1: "Restart", next1: 0, choice2: null}
]

current = stories[story_index]
button current.choice1, color: red, on tap: story_index = current.next1
if current.choice2 is not null:
  button current.choice2, color: blue, on tap: story_index = current.next2
```

Objects with `next1`/`next2` fields. Endings use `choice2: null`. Inline branching. No functions needed. Generated in under 4 seconds.

### Gemini 3.1 Pro — hardcoded if/else chain (no data structure)

```igni
if story_index is 0:
  story_text = "Your car has blown a tire..."
  choice1 = "I'll hop in..."
  choice2 = "Better ask him..."
  show_choice2 = true
else if story_index is 1:
  # ...

make_choice(choice):
  if story_index is 0:
    if choice is 1:
      story_index = 2
    else if choice is 2:
      story_index = 1
  # ... for every story node
```

No data structure. Every story hardcoded in if/else chains. ~80 lines vs ~40 for data-driven approaches. The only model that didn't use a list of objects.

### ChatGPT 5.3 — data-driven with boolean flag

```igni
stories = [
  {text: "...", c1: "...", n1: 2, c2: "...", n2: 1, end: false},
  # ...
  {text: "...", end: true}
]

current = stories[index]
if current.end:
  button "Restart", color: red, on tap: restart()
else:
  button current.c1, color: red, on tap: choose1()
  button current.c2, color: blue, on tap: choose2()
```

Objects with `end: true/false` flag. Shortest field names. Clean separation — endings are structurally different from branches.

### Claude Opus 4.6 — data-driven with boolean flag + explicit update

```igni
stories = [
  {text: "...", choice1: "...", choice2: "...", next1: 2, next2: 1, ending: false},
  # ...
  {text: "...", choice1: "Restart", choice2: "", next1: 0, next2: 0, ending: true}
]

current = stories[index]
if current.ending is not true:
  button current.choice2, color: blue, on tap: choose2()

choose1():
  index = current.next1
  current = stories[index]
```

Similar to ChatGPT but includes all fields on endings. Explicitly reassigns `current` inside choose functions.

## Architecture comparison

| Model | Data structure | Lines | Scalable? | Button visibility |
|---|---|---|---|---|
| Gemini Fast | Objects + null sentinel | ~40 | Yes | `choice2 is not null` |
| Gemini Pro | Hardcoded if/else | ~80 | No | `show_choice2` boolean |
| ChatGPT | Objects + `end` flag | ~35 | Yes | `if current.end:` branch |
| Claude | Objects + `ending` flag | ~45 | Yes | `ending is not true` |

**3/4 models chose data-driven architecture.** Stored branching logic in the data (next-node indices as object fields) rather than in code. Gemini Pro's hardcoded approach works for 6 nodes but wouldn't scale to 20+.

## Gaps surfaced

### 1. Background image as layout background

All 4 models wrote `image "background.png"` as a child inside the layout — but what they want is a background image on the layout itself (like CSS `background-image`). Igni has `background: red` for colours but no `background: "image.png"` for images. Real gap for apps with background imagery.

### 2. `image fill: true` not supported

Gemini Fast and ChatGPT wrote `image "background.png", fill: true`. `fill: true` only works on layouts. 2/4 signal.

### 3. `current = stories[index]` reactivity

3/4 models used `current = stories[index]` as a screen-level variable. Derived state question — when `index` changes, should `current` automatically update? In the build-locals system it would, but Claude also reassigns `current` inside functions, which could conflict.

## Convergence analysis

| App | Complexity | Convergence | Pattern |
|---|---|---|---|
| Dicee | Low | 4/4 identical | N/A |
| Xylophone | Medium | 2/2 pairs | Component vs inline |
| Quizzler (pre-indexing) | High | 4 distinct | Workaround divergence |
| Quizzler (post-indexing) | High | 4/4 near-identical | Convergence restored |
| Destini | High | 3/4 data-driven, 1 hardcoded | Architecture divergence |

**New finding:** Even with all features present, complex apps produce architectural divergence. This isn't a gap — both architectures work. It's a design choice the spec doesn't (and shouldn't) guide.

## Cheatsheet-only validation

4/4 produced valid Igni from the 300-line cheatsheet alone. The learning-order restructure (v0.6.6) didn't cause regressions.

---

## Full Spec Results

**Date:** 2026-04-13
**Input:** v0.6.6.md (full spec, post-doc-fixes: `on change:` example, `heading.small` definition, fetch distinction, theme caveat)
**Models tested:** Gemini 3.1 Fast, ChatGPT 5.3, Gemini 3.1 Pro, Claude Opus 4.6
**Prompt:** Same as cheatsheet test (see prompts.md)

Same prompt, same models, full spec instead of cheatsheet. The full spec includes the background image documentation (`background: "photo.png"`) that was the #1 gap from the cheatsheet test.

### Gemini 3.1 Fast — data-driven, empty-string sentinel

```igni
screen Destini, background: "background.png":
  index = 0
  story_data = [
    {text: "...", choice1: "...", next1: 2, choice2: "...", next2: 1},
    # ... endings have choice2: "", next2: null
  ]
  current = story_data[index]

  layout vertical, fill: true, padding: large, gap: medium:
    layout vertical, fill: true, align: center:
      label current.text, style: heading, color: white, align: center
    button current.choice1, color: red, on tap: index = current.next1
    if current.choice2 is not empty:
      button current.choice2, color: blue, on tap: index = current.next2
```

Same architecture as cheatsheet. Switched from `choice2: null` / `is not null` to `choice2: ""` / `is not empty`. Inline event handlers, no functions. Named list `story_data` instead of `stories`.

### ChatGPT 5.3 — data-driven, empty-string check, functions

```igni
screen Destini, title: "Destini", background: "background.png":
  index = 0
  stories = [
    {text: "...", choice1: "...", next1: 2, choice2: "...", next2: 1},
    # ... endings have choice2: "", next2: null
  ]
  current = stories[index]

  layout vertical, fill: true, padding: large, align: center:
    layout vertical, fill: true, align: center:
      label current.text, align: center, color: white, style: body
    layout vertical, gap: medium:
      button current.choice1, color: red, on tap: choose1()
      if current.choice2 is not empty:
        button current.choice2, color: blue, on tap: choose2()

  choose1():
    index = current.next1
  choose2():
    index = current.next2
```

Dropped the `end: boolean` flag from the cheatsheet version. Switched to full field names (`choice1` not `c1`). Added `title: "Destini"` app bar — only model to do so. Uses functions instead of inline handlers. `style: body` for story text instead of `heading`.

### Gemini 3.1 Pro — data-driven, null sentinel, short field names

```igni
screen Destini, background: "background.png":
  index = 0
  stories = [
    {text: "...", c1: "...", d1: 2, c2: "...", d2: 1},
    # ... endings have c2: null, d2: null
  ]
  current = stories[index]

  layout vertical, fill: true, padding: large:
    layout vertical, fill: true, align: center:
      label current.text, color: white, align: center
    layout vertical, gap: medium:
      button current.c1, color: red, on tap: index = current.d1
      if current.c2 is not null:
        button current.c2, color: blue, on tap: index = current.d2
```

**Major change from cheatsheet.** Cheatsheet produced ~80 lines of hardcoded if/else chains with no data structure. Full spec produced clean data-driven architecture in ~40 lines. The full spec's list/object examples were enough to teach the pattern. Shortest field names of any model (`c1`/`d1` instead of `choice1`/`next1`). Null sentinel for endings.

### Claude Opus 4.6 — data-driven, boolean flag, explicit reassignment

```igni
screen Destini, background: "background.png":
  index = 0
  stories = [
    {text: "...", choice1: "...", choice2: "...", dest1: 2, dest2: 1, ending: false},
    # ... endings have choice2: "", dest1: 0, dest2: 0, ending: true
  ]
  current = stories[index]

  layout vertical, fill: true, align: center, padding: large, gap: large:
    layout vertical, fill: true, align: center:
      label current.text, style: body, color: white, align: center
    layout vertical, gap: medium:
      button current.choice1, color: red, on tap: pick1()
      if not current.ending:
        button current.choice2, color: blue, on tap: pick2()

  pick1():
    index = current.dest1
    current = stories[index]
  pick2():
    index = current.dest2
    current = stories[index]
```

Nearly identical to cheatsheet version. Same `ending: boolean` flag. Same explicit `current = stories[index]` reassignment inside functions — doesn't trust reactivity to update derived state. Only model that populates all fields on endings (`dest1: 0, dest2: 0` instead of null). `not current.ending` instead of `current.ending is not true` (cheatsheet).

## Cheatsheet vs Full Spec Comparison

| Model | Cheatsheet architecture | Full spec architecture | Change |
|---|---|---|---|
| Gemini Fast | Data-driven, null sentinel | Data-driven, empty-string sentinel | Minor (sentinel strategy) |
| ChatGPT | Data-driven, `end` flag, short names | Data-driven, no flag, full names, functions | Cleaner |
| Gemini Pro | **Hardcoded if/else (~80 lines)** | **Data-driven, null sentinel (~40 lines)** | **Major** |
| Claude | Data-driven, `ending` flag, explicit reassign | Data-driven, `ending` flag, explicit reassign | Unchanged |

| Feature | Cheatsheet (4 models) | Full spec (4 models) |
|---|---|---|
| Background image correct | **0/4** (all used `image` child) | **4/4** (all used `background:`) |
| Data-driven architecture | 3/4 | **4/4** |
| Valid Igni (no invented syntax) | 4/4 | 4/4 |
| Uses functions | 2/4 | 2/4 |
| Derived state `current = stories[index]` | 4/4 | 4/4 |
| Explicit `current` reassign in functions | 1/4 (Claude) | 1/4 (Claude) |

### Ending detection strategies

| Model | Cheatsheet | Full spec |
|---|---|---|
| Gemini Fast | `choice2 is not null` | `choice2 is not empty` |
| ChatGPT | `if current.end:` (boolean) | `current.choice2 is not empty` |
| Gemini Pro | `show_choice2` variable | `current.c2 is not null` |
| Claude | `ending is not true` | `not current.ending` |

Two camps: null/empty check on the choice field (3 models) vs explicit boolean flag (Claude). Both are valid Igni.

## Gaps resolved by full spec

**1. Background image — FIXED.** The #1 gap from the cheatsheet test. 0/4 → 4/4. The `background: "photo.png"` addition to v0.6.6 worked exactly as intended. Every model used `screen Destini, background: "background.png":` without hesitation.

**2. `image fill: true` — not attempted.** 2/4 models tried this on the cheatsheet (wanting a full-bleed background image). With `background:` on the screen, there's no reason to reach for `image fill: true`. Gap eliminated by the feature that resolved gap 1.

## Gaps persisting

**1. `current = stories[index]` derived state.** All 4 models write `current = stories[index]` at screen body level, expecting it to update when `index` changes. 3/4 rely on reactivity to handle this; Claude explicitly reassigns `current` inside functions. The spec's reactivity rule says "each screen re-evaluates from the top when any variable it references is reassigned" — which means re-evaluating `current = stories[index]` after `index` changes. Claude's explicit reassignment is defensive but harmless. This is a clarification opportunity, not a language gap.

## Findings

**Full spec produces better results than cheatsheet for complex apps.** The cheatsheet is sufficient for simple apps (4/4 valid Igni on both runs), but the full spec's examples teach architectural patterns that the cheatsheet's compressed format doesn't convey. Gemini Pro's jump from hardcoded to data-driven is the clearest evidence — the full spec showed it how to use lists of objects for data-driven architecture.

**Background image spec addition validated.** The v0.6.6 background image feature was driven by 4/4 models attempting image backdrops in the cheatsheet test. Running the same test with the feature documented produced 4/4 correct usage. Spec → gap → feature → re-test → confirmed fix. The feedback loop works.

**Doc fixes not exercised.** The four documentation fixes (on change, heading.small, fetch distinction, theme caveat) were not tested by Destini — the app doesn't use dropdowns, subheadings, fetch, or theme blocks. A different app (e.g. a settings screen with dropdowns and fetch) would be needed to validate those fixes.
