# Cold-LLM Test: Music Player (Igni v0.4)

**Spec version tested:** Igni v0.4
**Test run dates:** 2026-04-11 (all three models complete)
**Source prompt:** `prompts.md` → Music player

## The prompt

> Using only the Igni language spec above, write a music player screen in Igni. Show album art, song title, artist, a progress slider, and play/pause/skip-back/skip-forward buttons in a row at the bottom.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Claude

**Model version:** Claude Opus 4.6
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen MusicPlayer:
  song = {title: "Neon Lights", artist: "Boojacka", art: "/img/album.jpg"}
  progress = 0
  playing = false

  layout vertical, align: center, padding: large, gap: large:
    image song.art, size: 280, rounded: medium
    layout vertical, align: center, gap: small:
      label song.title, style: heading
      label song.artist, style: body, color: subtle
    slider bind: progress, min: 0, max: 100
    layout horizontal, gap: large, align: center:
      button "Skip Back", on tap: skip_back()
        icon "skip-back", size: large
      if playing:
        button "Pause", on tap: playing = false
          icon "pause", size: large
      else:
        button "Play", on tap: playing = true
          icon "play", size: large
      button "Skip Forward", on tap: skip_forward()
        icon "skip-forward", size: large

  skip_back():
    progress = 0

  skip_forward():
    progress = 100
```

### Grading

- **Invented syntax not in the spec?** **Yes — two things:**
  - **`icon` as a child of `button`** (the indented `icon "skip-back", size: large` under `button "Skip Back"`). Buttons are primitives, not blocks — they don't have children. The spec only shows `button "label", color: ..., on tap: ...` with a text label. There's no compound button-with-icon shape.
  - **`rounded: medium`** on `image`. The spec example uses `round: true` (boolean) for circular images, not `rounded: <token>` (which is a layout corner-radius property). Borderline — possibly conflated `image round:` with `layout rounded:`.
- **Used existing syntax wrong?** The combined button-plus-indented-icon pattern is structurally invalid (buttons don't open child blocks).
- **Valid Igni on first try?** **No.** The icon-in-button pattern doesn't compile as written.
- **Line count:** ~28 lines.

### Notes

- **Over-engineered the icon-button compound.** Both Gemini and ChatGPT used `icon "skip-back", on tap: skip_back()` directly — the v0.4 rule that `on tap:` attaches to *any* primitive (including `icon`) makes this trivial. Claude tried to wrap each icon in a button, which doesn't fit the spec.
- **The fix:** drop the buttons and put `on tap:` on the icons. The spec already supports this (icons are primitives, `on tap:` is universal in v0.4). This is a missed-the-pattern issue, not a missing feature.
- **`rounded: medium` on image** is a small confusion — the user probably meant `round: true` for circular avatar-style art. Or if they wanted rounded-square art, the spec doesn't currently support that distinction (the layout `rounded:` token is for layout corners, not image corners).
- **Functions inside screen, calculator-state pattern, slider with bind, conditional play/pause** — all correct usage of v0.4 features.

---

## Gemini

**Model version:** Gemini Thinking 3.0
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen MusicPlayer:
  playing = false
  progress = 35
  current_track = {title: "Midnight City", artist: "M83", cover: "https://example.com/album.jpg"}

  layout vertical, align: center, gap: large, padding: large:
    image current_track.cover, size: 300, round: true

    layout vertical, align: center, gap: small:
      label current_track.title, style: heading
      label current_track.artist, style: body, color: subtle

    slider bind: progress, min: 0, max: 100

    layout horizontal, gap: large, align: center:
      icon "skip-back", size: large, on tap: previous()

      if playing:
        icon "pause", size: large, on tap: playing = false
      else:
        icon "play", size: large, on tap: playing = true

      icon "skip-forward", size: large, on tap: next()

  next():
    # Logic for next track would go here
    progress = 0

  previous():
    # Logic for previous track would go here
    progress = 0
```

### Grading

- **Invented syntax not in the spec?** **No.** Zero inventions.
- **Used existing syntax wrong?** **No.**
- **Valid Igni on first try?** **Yes.** Clean v0.4 throughout.
- **Line count:** ~30 lines.

### Notes

- **Used `icon` directly with `on tap:`** for all four control buttons — the v0.4 pattern that Claude missed. This is the right way to do icon buttons in Igni.
- **First test in the suite to use the v0.4 `#` comment syntax.** Gemini wrote `# Logic for next track would go here` inside the `next()` and `previous()` function bodies as TODO placeholders. The v0.4 Comments section landed cleanly.
- **Object literal for the track** with three fields (title, artist, cover URL).
- **Initial state** has `progress = 35` to give the slider a non-zero starting position. Tiny detail but suggests Gemini was thinking about how it'd render visually.
- **Conditional rendering for play/pause** uses two separate `icon` lines inside `if`/`else`, with each one having its own `on tap:` to flip `playing`. Same pattern from the v0.3.1 comparison test.

---

## GPT

**Model version:** ChatGPT (free tier, model version not displayed)
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen MusicPlayer(track):
  position = 0
  playing = false

  layout vertical, align: center, padding: large, gap: large:
    image track.artwork, size: 200, round: true

    label track.title, style: heading
    label track.artist, style: body, color: subtle

    slider bind: position, min: 0, max: track.duration

    layout horizontal, align: center, gap: large:
      icon "skip-back", size: large, on tap: skip_back()
      icon play_pause_icon(), size: large, on tap: toggle_play()
      icon "skip-forward", size: large, on tap: skip_forward()

  toggle_play():
    playing = not playing

  skip_back():
    position = 0

  skip_forward():
    position = track.duration

  play_pause_icon():
    if playing:
      return "pause"
    else:
      return "play"
```

### Grading

- **Invented syntax not in the spec?** **Borderline — one creative use:** `icon play_pause_icon(), size: large` calls a function in argument position to dynamically choose the icon name. The spec defines screen-internal functions and shows them being called from `on tap:`, but doesn't explicitly show function-call-as-expression in a positional argument slot. The syntax is *consistent* with how the spec works (functions return values; values can go where values are expected) but isn't shown in any spec example. **Counts as a creative extension rather than an invention** — it's the kind of pattern that should be valid but isn't documented.
- **Used existing syntax wrong?** **No.**
- **Valid Igni on first try?** **Yes-with-caveat.** Structure is valid; the `play_pause_icon()` inline call is the only thing that might surprise a strict parser implementation.
- **Line count:** ~29 lines.

### Notes

- **Took `track` as a screen argument** (`screen MusicPlayer(track)`), the only model that did. The other two embedded a hardcoded track. ChatGPT's approach is more reusable but assumes a navigation context the prompt didn't specify.
- **`playing = not playing` toggle** in a single function — the cleanest play/pause toggle of the three. Both Gemini and Claude used separate `if`/`else` branches; ChatGPT used a single `toggle_play()` function with `not`.
- **Function-as-argument** for the play/pause icon — `icon play_pause_icon()` substitutes the result of the function call into the icon name slot. Smart abstraction, slightly outside what the spec explicitly shows.
- **Used `icon` directly with `on tap:`** like Gemini — got the right pattern.
- **No `on tap:` on the play/pause icon?** Wait — looking again, ChatGPT wrote `on tap: toggle_play()` so it does. Good.
- **`max: track.duration`** for the slider — uses a numeric value from the track object as the slider max. Works with v0.4's numeric handling.

---

## Gaps observed (across all three models)

This was supposed to be the **happy-path baseline.** Two out of three models passed it cleanly. Claude is the outlier.

### The cross-model gap matrix (Music Player)

| Concern | Claude Opus 4.6 | Gemini Thinking 3.0 | ChatGPT (free) |
|---|---|---|---|
| Invented syntax | **Yes — `icon` as button child, `rounded: medium` on image** | None | Borderline (`icon function_call()`) |
| Used existing wrong | **Yes — button doesn't open a child block** | None | None |
| Valid first try | **No** | Yes | Yes (with caveat) |
| Used `icon ... on tap:` directly | No (wrapped in buttons) | **Yes** | **Yes** |
| Used `# comments` | No | **Yes (first time in suite)** | No |
| Functions inside screen | Yes | Yes | Yes |

### The single real finding

**Claude's icon-in-button pattern is the only spec-relevant finding.** It surfaces a missing example, not a missing feature: v0.4 already supports `icon "name", on tap: handler()` (because `on tap:` is universal in v0.4), but the spec doesn't show this as the "icon button" pattern. Two out of three models found it anyway, but Claude over-engineered.

**Possible v0.4.1 patch (one line):** add an example to the Built-in Primitives section or the Events section showing `icon "play", on tap: play_song()` as the canonical icon-button form. Tiny clarification, no new feature.

### Borderline finding

**ChatGPT's `icon play_pause_icon()`** uses a function call in argument position. The spec defines functions and return values but doesn't explicitly show inline function-call-as-expression. This is a discoverable pattern that happens to work, but the spec could be more explicit about whether function calls compose anywhere a value is expected. **Possible v0.4.1 clarification:** one sentence in the Functions section — *"A function call returns a value that can be used wherever a value is expected, including as a positional argument to a primitive (e.g. `icon get_icon(), size: large`)."*

### Confirmed v0.4 win

**Gemini used the `#` comment syntax** added in v0.4. First test in the suite to actually use comments. Validates that the addition was discoverable.

### Predicted gaps that did NOT surface

- **None significant.** This was supposed to be the happy-path test. The gaps that did surface (Claude's icon-in-button, ChatGPT's function-as-arg) weren't predicted because they're more about model habits than language design.

---

## v0.4 acceptance verdict

**PARTIAL.** Two of three models (Gemini, ChatGPT) produced valid Igni with no significant inventions. Claude over-engineered the icon button pattern by trying to combine `button` and `icon` in a compound shape that doesn't exist in the spec.

**This is NOT a v0.4 design failure** — the right pattern (`icon "name", on tap: handler`) is fully supported by v0.4 and was found by 2/3 models. It's a *missing example* in the spec, not a missing feature. A one-line addition to the Built-in Primitives or Events section showing `icon` as an icon-button would catch Claude on the next run.

**Recommendation:** ship v0.4 as-is, but consider a v0.4.1 patch with two one-line clarifications:

1. **Icon buttons:** an example showing `icon "play", on tap: play_song()` in the Built-in Primitives section.
2. **Functions as expressions:** one sentence in the Functions section noting that function calls return values that compose anywhere a value is expected.

Both are documentation, not new features. Total budget impact: zero.

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni, with `# GAP:` comments where you hit walls.

```igni
(paste your hand-written attempt here)
```
