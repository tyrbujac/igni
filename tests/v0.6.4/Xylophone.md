# Xylophone Cold Test Results

**Date:** 2026-04-13
**Models tested:** Claude Opus 4.6, Gemini 3.1 Pro, Gemini 3.1 Fast, ChatGPT 5.3
**Spec:** v0.6.4
**Source:** Angela Yu's "Complete Flutter Development Bootcamp" — Xylophone app (Section 7)

## What Xylophone tests

Seven coloured bars stacked vertically, each filling equal screen space. Tap a bar to play a musical note. Black background. Tests: `fill: true` on layouts, `play()` audio builtin, `on touch:` event, empty layout blocks, colour names.

## Results — 4/4 transpile (2 needed minor fixes)

| Model | Transpiles? | Approach | Audio handling | `teal` |
|---|---|---|---|---|
| Gemini 3.1 Fast | Yes | Component extraction (`XylophoneBar`) | `play_note()` + `return null` | Used `brand` |
| Gemini 3.1 Pro | Yes | Component extraction (`NoteBar`) | `play_note()` sets `active_note` | Used `teal` |
| ChatGPT 5.3 | Yes (after fix) | Inline layouts, empty blocks | `play()` + comment | Used `teal` |
| Claude Opus 4.6 | Yes (after fix) | Inline layouts, `label ""` placeholders | `play_note()` + comment | Used `brand` |

## Convergence analysis

**Weaker convergence than Dicee.** Two distinct approaches:

1. **Component extraction (Gemini Fast, Gemini Pro):** Extracted a reusable `XylophoneBar`/`NoteBar` component with colour and note as parameters. DRYer but more complex.
2. **Inline repetition (ChatGPT, Claude):** Seven inline layouts with explicit colours and tap handlers. More verbose but simpler to read.

Both are valid Igni. The divergence is a design choice the spec doesn't guide — and shouldn't.

## Reference Igni output

```igni
screen Xylophone, background: black:
  layout vertical:
    layout vertical, fill: true, background: red, on tap: play("note1.wav"):
    layout vertical, fill: true, background: orange, on tap: play("note2.wav"):
    layout vertical, fill: true, background: yellow, on tap: play("note3.wav"):
    layout vertical, fill: true, background: green, on tap: play("note4.wav"):
    layout vertical, fill: true, background: teal, on tap: play("note5.wav"):
    layout vertical, fill: true, background: blue, on tap: play("note6.wav"):
    layout vertical, fill: true, background: purple, on tap: play("note7.wav"):
```

10 lines vs 45 lines Flutter (4.5x reduction).

## Gaps surfaced

1. **Empty layout blocks** — ChatGPT wrote layouts with no children. Parser didn't handle it. Fixed by making INDENT optional after colon.
2. **`teal` colour missing** — 2/4 models used `teal` (not in colour map). Fixed by adding it.
3. **Audio gap** — all four models handled gracefully with placeholder functions. None invented syntax. The "honest no" signal: models correctly identified the spec boundary.

## Features driven by Xylophone

1. **`play` audio builtin** — `play("note1.wav")` emits `_audioPlayer.play(AssetSource(...))`
2. **`audio/` folder convention** — mirrors `images/`, drop files in, reference by name
3. **`teal` colour** — added to colour map (2/4 models expected it)
4. **Empty layout blocks** — parser handles layouts with `background:` and `on tap:` but no children
5. **`crossAxisAlignment: CrossAxisAlignment.stretch`** — auto-added when children use `fill: true`

## Convergence finding

| App | Convergence | Ambiguity level |
|---|---|---|
| Dicee | 4/4 identical structure | Low — clear requirements, few design choices |
| Contacts | 3/4 similar | Medium — component extraction, filter approach |
| Xylophone | 2/2 pairs (component vs inline) | Medium — repetition pattern, audio gap |

Simple apps with clear requirements produce identical LLM output. Complex apps with design choices produce structural variation.
