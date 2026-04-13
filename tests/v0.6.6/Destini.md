# Destini Cold Test Results

**Date:** 2026-04-13
**Models tested:** Claude Opus 4.6, Gemini 3.1 Pro, Gemini 3.1 Fast, ChatGPT 5.3
**Input:** v0.6.6-cheatsheet.md only (cheatsheet-only methodology)
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
