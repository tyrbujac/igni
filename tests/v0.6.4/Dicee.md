# Dicee Cold Test Results

**Date:** 2026-04-13
**Models tested:** Claude Opus 4.6, Gemini 3.1 Pro, Gemini 3 Flash, ChatGPT 5.3
**Spec:** v0.6.3
**Source:** Angela Yu's "Complete Flutter Development Bootcamp" — Dicee app (Section 5)

## What Dicee tests

Two-dice roller. Two dice images side by side, tap either to roll it. Red background, title bar at top. Tests: state management, local images, events, layout, screen properties, `random()`, string concatenation for dynamic image paths.

## Results — 4/4 zero-fix

| Model | Transpiles? | Fixes needed | Notes |
|---|---|---|---|
| Claude Opus 4.6 | Yes | 0 | `random()` as initial value |
| Gemini 3.1 Pro | Yes | 0 | Most minimal |
| Gemini 3 Flash | Yes | 0 | Title label included |
| ChatGPT 5.3 | Yes | 0 | |

**4/4 zero-fix.** All four models produced nearly identical code — same screen name, same URL construction with `+` concatenation, same `random(1, 6)`, same horizontal layout. Strongest convergence yet.

**0/4 used string interpolation.** All correctly used `+` concatenation for `"dice" + die1 + ".png"`. The "no interpolation" rule held perfectly.

## Reference Igni output

```igni
screen Dicee, title: "Dicee", background: red:
  die1 = 1
  die2 = 1

  layout horizontal, gap: large, align: center:
    image "dice" + die1 + ".png", size: 180, on tap: roll_left()
    image "dice" + die2 + ".png", size: 180, on tap: roll_right()

  roll_left():
    die1 = random(1, 6)

  roll_right():
    die2 = random(1, 6)
```

13 lines vs 56 lines Flutter (4.3x reduction).

## Gaps surfaced

None — first 4/4 zero-fix test on an Angela Yu project.

## Features driven by Dicee

Building the Dicee app surfaced five transpiler gaps, each built because a real app needed it:

1. **Extended colour names** — `red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`
2. **Background colours on layouts** — `resolveBackground()` expanded beyond `card`/`overlay`
3. **Local image assets** — `image "dice1.png"` → `Image.asset()`, `images/` folder auto-synced
4. **Screen properties** — `screen Name, title: "Title", background: red:`
5. **AppBar** — `title:` on screens emits `AppBar(title: Text(...))`

## Also in this round: Contacts 3/3 zero-fix

After adding type hint support to the transpiler:

| Model | Before type hints | After type hints |
|---|---|---|
| Gemini 3.1 Pro | 0 fixes | 0 fixes |
| Claude Opus 4.6 | 1 fix (type hint) | **0 fixes** |
| ChatGPT 5.3 | 1 fix (type hint) | **0 fixes** |
