# Igni v0.4 — Cold-LLM Test Summary

**Spec version:** v0.4
**Test suite run:** 2026-04-11 (in progress: 2 of 3 complete)
**Apps tested:** Chat (PASS), Music Player (PARTIAL), Notes (pending)
**Models tested:** Claude Opus 4.6, Gemini Thinking 3.0, ChatGPT (free tier)

## Headline result so far

- **Chat: PASS.** First 100% clean test in the suite history. All three models, zero inventions.
- **Music Player: PARTIAL.** 2/3 models clean (Gemini, ChatGPT). Claude invented an `icon`-as-`button`-child compound pattern that doesn't exist in v0.4. The fix is documentation, not new features — the right pattern (`icon "play", on tap: handler`) is already supported, just not shown in the spec as the canonical "icon button" form.

The most important findings so far:

1. **Gemini finally adopted `is not empty`** in Chat instead of inventing `==`/`!=` — the v0.4 documentation of `is X` for arbitrary equality empirically captured Gemini's preference. The equality gap is now closed across all three models.
2. **Gemini used the `#` comment syntax** in Music Player — first test in the suite to actually use comments. Validates that the v0.4 Comments section was discoverable.
3. **The `on tap:` on any primitive rule** (v0.3.2 → v0.4) needs an explicit "icon button" example. 2/3 models found it cold; Claude over-engineered without it.

The remaining test (Notes) will determine the final v0.4 acceptance verdict.

## Apps × models matrix

| App           | Claude Opus 4.6 | Gemini Thinking 3.0 | ChatGPT (free) | Verdict |
|---|---|---|---|---|
| Chat          | **Y**            | **Y**                | **Y**           | **PASS** (zero inventions) |
| Music Player  | **N** (invented icon-in-button) | **Y** | **~** (function-as-arg, borderline) | **PARTIAL** |
| Notes         | _pending_        | _pending_            | _pending_       | _pending_ |

Legend: **Y** = valid Igni first-try, no inventions. **N** = failed (invented syntax). **~** = valid but with subtle issues.

## Confirmed v0.4 wins (across both completed tests)

Validated empirically by Chat and/or Music Player:

1. **`is X` for arbitrary equality** — Chat: all three models used `is not empty`. **Gemini in particular** adopted it in Chat after consistently inventing `==`/`!=` in v0.3.2 testing. The v0.4 documentation worked.
2. **Reactive input clearing via `draft = ""`** — Chat: all three. The two-way `bind` model is intuitive.
3. **List append with `+`** — Chat: all three used `messages = messages + [{...}]`.
4. **Object literals in append context** — Chat + Music Player: all three constructed objects with `{key: value}` correctly.
5. **Functions inside screens close over state** — both tests: all six (3 models × 2 tests). Universal.
6. **`on tap:` attaches to any primitive** — Music Player: 2/3 models used `icon "name", on tap: handler` directly. Claude missed it; the others used the v0.4 universal-`on-tap` rule cleanly.
7. **`#` for comments** — Music Player: Gemini used `# Logic for next track would go here` inside function bodies. First test to exercise the v0.4 Comments section.
8. **Component extraction is encouraged but not enforced** — Chat: 2/3 extracted `MessageBubble`, 1/3 inlined. Both forms valid.

## Gaps observed (so far)

### From Chat

**None.** Zero gaps.

### From Music Player

1. **Icon-button pattern not shown explicitly** (Claude only). Claude tried to wrap icons inside buttons as compound primitives, which doesn't exist in v0.4. The right pattern (`icon "name", on tap: handler()`) is fully supported but not shown in the spec. **Possible v0.4.1 patch:** add a one-line example to Built-in Primitives or Events.
2. **Function-call-as-expression in argument position** (ChatGPT, borderline). ChatGPT wrote `icon play_pause_icon(), size: large`, calling a function inline to choose the icon name. Spec doesn't explicitly show this pattern but it's consistent with the existing function/return-value semantics. **Possible v0.4.1 patch:** one sentence in Functions section noting that function calls compose anywhere a value is expected.
3. **`rounded: medium` on `image`** (Claude only). Claude wrote `image song.art, size: 280, rounded: medium`. The spec example uses `round: true` (boolean, for circular images). `rounded:` is a layout corner-radius token. Possible spec confusion between `image round:` (boolean) and `layout rounded:` (token). Worth a one-line clarification.

### Predicted gaps that did NOT surface

- **Input clearing** (Chat): all three models found `draft = ""`. Not a gap.
- **Scroll-to-bottom** (Chat): not attempted by any model. Treated as out-of-scope rather than invented.
- **Music Player happy path**: was supposed to be the easy baseline. Mostly held — only Claude tripped, and it was on a missing-example issue rather than a missing feature.

## Per-model observations

### Claude Opus 4.6

- **Chat:** Extracted `MessageBubble` as a component, used `is not empty` cleanly, zero inventions.
- **Music Player:** Over-engineered the icon button pattern (compound `button` + indented `icon` child, which isn't valid). Used `rounded: medium` on `image` (probably meant `round: true`). **Only model so far to fail a v0.4 acceptance test.**
- **Pattern:** Claude leans toward more structured / decomposed solutions even when the simpler primitive pattern would work. In Chat this was a strength (clean component extraction); in Music Player it became a weakness (invented compound primitive).

### Gemini Thinking 3.0

- **Chat:** Extracted `MessageBubble`, seeded with system message, **first time using `is not empty` in the suite** (the v0.4 documentation worked).
- **Music Player:** Clean v0.4 throughout. **First test to actually use the `#` comment syntax** added in v0.4. Used `icon "name", on tap: handler` for all controls — the right pattern.
- **Pattern:** Gemini in v0.4 is a noticeably different model than Gemini in v0.3.2 testing. The equality outlier behaviour vanished, and Gemini now uses v0.4 features (comments, `is X`, universal `on tap:`) cleanly.

### ChatGPT (free)

- **Chat:** Inlined message rendering instead of extracting a component (still valid). Most compact output. Used `is not empty` and `draft = ""` cleanly.
- **Music Player:** Took `track` as a screen argument (only model to do so). Used `playing = not playing` for the toggle (cleaner than the if/else swap pattern). **Borderline finding:** `icon play_pause_icon()` calls a function inline to choose the icon name, which the spec doesn't explicitly show as a pattern.
- **Pattern:** ChatGPT continues to be the most compact and most JS-idiom-prone of the three. The function-as-expression pattern is creative but consistent with how the spec defines functions.

## Cross-test progress (v0.3.2 → v0.4)

| Test | Spec | Models | Verdict | Inventions |
|---|---|---|---|---|
| Calculator | v0.3.2 | 3 | FAIL → fed v0.4 backlog | Universal: arithmetic operators, equality (2/3 used `is X`); per-model: type conversion, truthiness |
| Todo | v0.3.2 | 3 | FAIL → fed v0.4 backlog | Universal: list `+`, list removal; per-model: `without`, `each` in functions, `continue`, `color: x and y`, in-place mutation |
| Weather | v0.3.2 | 3 | PARTIAL → fed v0.4 backlog | Universal: number+string `+`; per-model: `null`, manual state vs reactive read |
| **Chat** | **v0.4** | **3** | **PASS** | **None** |
| **Music Player** | **v0.4** | **3** | **PARTIAL** | Claude only: icon-in-button compound, `rounded: medium` on image; ChatGPT borderline: function call as inline argument |
| Notes | v0.4 | _pending_ | _pending_ | _pending_ |

**15 independent data points so far** (5 apps × 3 models). The first three tests fed the v0.4 backlog; v0.4 is now 2/3 of the way through acceptance.

## Conclusions and v0.5 priorities (so far)

After Chat + Music Player:

- **v0.4 ships unchanged for chat-app and media-player use cases** for 5 out of 6 (model × app) combinations. The one outlier (Claude on Music Player) is fixable with documentation, not features.
- **Possible v0.4.1 patch (3 one-line additions):**
  1. Add an "icon button" example showing `icon "play", on tap: play_song()` in Built-in Primitives or Events.
  2. Add one sentence in Functions section: function calls return values that compose anywhere a value is expected.
  3. Clarify `image round: true` (boolean, for circular) vs `layout rounded: <token>` (corner-radius for layouts). Currently the two are easy to conflate.
- **Potential v0.5 features identified so far:** scroll-to-bottom for long lists (from Chat). Lower priority than the cross-screen state question that Notes is expected to surface.

After Notes is complete, this section will be updated with the full v0.5 backlog and the final v0.4 acceptance verdict (PASS, PARTIAL, or FAIL across the suite).

## Methodology notes

- Spec version tested: `spec/v0.4.md`
- Prompts source: `tests/v0.4/prompts.md` (sections 4, 5, 6)
- Each model tested in a fresh chat conversation: no system prompt, no prior context, no custom instructions enabled
- Outputs captured into `tests/v0.4/<App>.md` per the test methodology in `tests/README.md`
- **Verdict criteria:** PASS = zero inventions across all models; PARTIAL = at least one model invents but inventions are minor or v0.5-deferrable; FAIL = multiple models invent things v0.4 should have covered

## Pointers

- Per-test result files: `tests/v0.4/Chat.md`, `MusicPlayer.md`, `Notes.md`
- Prompts used: `tests/v0.4/prompts.md`
- Spec snapshot tested: `spec/v0.4.md`
- v0.3.2 backlog (the source of v0.4): `tests/v0.3.2/summary.md`
