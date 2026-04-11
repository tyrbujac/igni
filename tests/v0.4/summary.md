# Igni v0.4 — Cold-LLM Test Summary

**Spec version:** v0.4
**Test suite run:** 2026-04-11 (complete: 3 of 3)
**Apps tested:** Chat (PASS), Music Player (PARTIAL), Notes (MIXED)
**Models tested:** Claude Opus 4.6, Gemini Thinking 3.0, ChatGPT (free tier)

## Headline result

**v0.4 is shippable as the stable release.** All three acceptance tests are complete. The PARTIAL and MIXED findings surface real but recoverable issues that can be addressed with a small v0.4.1 documentation patch (5 one-line additions, no new features).

The most consequential finding is from **Notes**: Claude's honest "this can't be done" output explicitly identified the cross-screen state gap that v0.4 has. **Gemini found a clever single-screen pattern that sidesteps the gap for the specific list/detail case**, but this is a tactical workaround for tightly coupled flows — NOT a universal solution. **Cross-screen shared state remains a real v0.5 priority**, demoted from urgent (because v0.4 + Gemini's pattern handle the most common case) but not eliminated.

The other major finding from the v0.4 round is that **Gemini finally adopted `is not empty`** in Chat instead of inventing `==`/`!=`. The v0.4 documentation of `is X` for arbitrary equality empirically captured Gemini's preference. The equality gap is now closed across all three models.

## Apps × models matrix

| App           | Claude Opus 4.6 | Gemini Thinking 3.0 | ChatGPT (free) | Verdict |
|---|---|---|---|---|
| Chat          | **Y** | **Y** | **Y** | **PASS** (zero inventions) |
| Music Player  | **N** (icon-in-button compound, `rounded: medium`) | **Y** | **~** (function-as-arg, borderline) | **PARTIAL** |
| Notes         | **Y-incomplete** (no-op save/delete with honest explanation) | **Y** (single-screen workaround) | **N** (invented cross-screen function visibility) | **MIXED** |

Legend: **Y** = valid Igni first-try, no inventions. **N** = failed (invented syntax). **~** = valid but with subtle issues. **Y-incomplete** = structurally valid, app doesn't work end-to-end.

## Confirmed v0.4 wins (across all three tests)

Validated empirically by Chat, Music Player, and Notes:

1. **`is X` for arbitrary equality** — Chat: all three models used `is not empty`. **Gemini in particular** had been the consistent equality outlier in v0.3.2 testing; it adopted `is not empty` in Chat and `is null` / `is empty` in Notes naturally. The v0.4 documentation worked.
2. **`null` and `is null`** — Notes: Gemini reached for the v0.4 null value as the "no detail view active" sentinel. First test to exercise the new null pattern.
3. **`#` comments** — Music Player (Gemini), Notes (Claude as gap-doc, Gemini as section markers). Three of the five v0.4 acceptance tests now use comments.
4. **`each` in non-rendering contexts** — Notes: ChatGPT and Gemini both used `each` inside function bodies for filter loops. v0.4 each-in-functions landed cleanly.
5. **`without(list, item)` for removal** — Notes: ChatGPT and Gemini both reached for the v0.4 builtin. Claude didn't need it (no-op delete).
6. **List append with `+`** — Chat + Notes: all six (3 models × 2 tests). Universal pattern, exactly as v0.4 specifies.
7. **Reactive input clearing via `draft = ""`** — Chat: all three models. The two-way `bind` model is intuitive.
8. **Functions inside screens close over state** — every test, every model. Universal.
9. **`on tap:` attaches to any primitive** — Music Player: 2/3 models used `icon "name", on tap: handler` directly. Notes: all three used `NoteCard note, on tap: navigate to NoteDetail note` (component invocation form).
10. **Component extraction is encouraged but not enforced** — Chat (2/3), Notes (Claude `NoteCard`, Gemini `NoteRow`, ChatGPT `NoteItem`).
11. **Object literals** — Notes: all three constructed note objects with `{title, body}` correctly.
12. **Conditional rendering with `if/else`** — every test. Notes: Gemini used it at the screen-body level to swap between list and detail views.

## Gaps observed across the v0.4 round

### From Chat — none

Zero gaps. First clean test in the suite.

### From Music Player — recoverable with documentation

1. **Icon-button pattern not shown explicitly** (Claude only). Claude tried to wrap icons inside buttons as compound primitives. The right pattern (`icon "name", on tap: handler()`) is fully supported but not shown in the spec. **v0.4.1 fix:** add a one-line example.
2. **Function-call-as-expression in argument position** (ChatGPT, borderline). ChatGPT wrote `icon play_pause_icon(), size: large`. Spec doesn't explicitly show this pattern but it's consistent with the existing function/return-value semantics. **v0.4.1 fix:** one sentence in Functions section.
3. **`rounded: medium` on `image`** (Claude only). Conflated `image round: true` (boolean, circular) with `layout rounded: <token>` (corner-radius). **v0.4.1 fix:** one-line clarification.

### From Notes — surfaces a real v0.5 priority

4. **Cross-screen state.** All three models hit it. Claude explicitly named the gap and refused to invent. Gemini sidestepped via the single-screen pattern (tactical, doesn't scale). ChatGPT invented cross-screen function visibility. **v0.4.1 fix (partial):** add an explicit rule that screens called via `navigate to` cannot call functions defined in the navigating screen, plus an example of the single-screen pattern as a tactical workaround for tightly coupled list/detail flows. **v0.5 fix (real):** design a shared-state mechanism for the cases the single-screen pattern can't reach.
5. **Single-screen multi-view pattern not documented.** Gemini's pattern works and is genuinely useful for list/detail flows. **v0.4.1 fix:** document it with caveats — explicit framing as a tactical pattern for tightly coupled flows, NOT the canonical architecture.

## Per-model observations (v0.4 round)

### Claude Opus 4.6

- **Chat:** Extracted `MessageBubble`, used `is not empty` cleanly, zero inventions.
- **Music Player:** Over-engineered the icon button pattern (compound `button` + indented `icon` child). Used `rounded: medium` on `image`. **Only model so far to fail a v0.4 acceptance test on inventions.**
- **Notes:** Wrote a structurally clean two-screen architecture and **explicitly named the cross-screen state gap in prose alongside the code.** Refused to invent. The most diagnostically useful output in the entire test suite.
- **Pattern:** Claude leans toward structured/decomposed solutions and is honest about limitations. In Music Player this became over-engineering; in Notes it became invaluable diagnostic data.

### Gemini Thinking 3.0

- **Chat:** Extracted `MessageBubble`, **first time using `is not empty` in the suite** (the v0.4 `is X` documentation captured Gemini's preference at last).
- **Music Player:** Clean v0.4 throughout. **First test to use the v0.4 `#` comment syntax.** Used `icon "name", on tap: handler` directly.
- **Notes:** **Found the single-screen multi-view pattern** that sidesteps cross-screen state for this specific case. Used `null`, `is null`, `is empty`, `each` in functions, `without`, comments — every v0.4 feature relevant to the use case.
- **Pattern:** Gemini in v0.4 is consistently the most idiom-discovering of the three models. It finds the cleanest path through existing primitives without inventing.

### ChatGPT (free)

- **Chat:** Inlined message rendering (still valid). Most compact output. Used `is not empty` and `draft = ""` cleanly.
- **Music Player:** Took `track` as a screen argument (only model to do so). Used `playing = not playing` for the toggle. Borderline finding: `icon play_pause_icon()` calls a function inline.
- **Notes:** Took the obvious two-screen approach and **invented cross-screen function visibility** to make `save` and `delete` work. The most predictable failure mode of the three.
- **Pattern:** ChatGPT consistently picks the most JS-idiomatic approach and invents the missing piece. Most useful for surfacing "what gap will an average developer hit first" data.

## Cross-test progress (v0.3.2 → v0.4)

| Test | Spec | Models | Verdict | Inventions |
|---|---|---|---|---|
| Calculator | v0.3.2 | 3 | FAIL → fed v0.4 backlog | Universal: arithmetic operators, equality (2/3 used `is X`); per-model: type conversion, truthiness |
| Todo | v0.3.2 | 3 | FAIL → fed v0.4 backlog | Universal: list `+`, list removal; per-model: `without`, `each` in functions, `continue`, `color: x and y`, in-place mutation |
| Weather | v0.3.2 | 3 | PARTIAL → fed v0.4 backlog | Universal: number+string `+`; per-model: `null`, manual state vs reactive read |
| **Chat** | **v0.4** | **3** | **PASS** | **None** |
| **Music Player** | **v0.4** | **3** | **PARTIAL** | Claude only: icon-in-button compound, `rounded: medium` on image; ChatGPT borderline: function call as inline argument |
| **Notes** | **v0.4** | **3** | **MIXED** | Claude: none (no-op save/delete with honest comment); Gemini: none (single-screen workaround); ChatGPT: cross-screen function visibility |

**18 independent data points across 6 apps × 3 models.** v0.4 acceptance is complete. The first three tests (v0.3.2 round) fed the v0.4 backlog; the last three (v0.4 round) validated v0.4 against new use cases.

## Conclusions and v0.5 priorities

### v0.4 acceptance status: SHIPPABLE

v0.4 is the stable release. The PARTIAL and MIXED findings are all addressable with documentation patches; no language changes are needed for v0.4 itself.

### Recommended v0.4.1 patch (5 documentation additions)

All five are one-line additions, no new features, total budget impact zero:

1. **Single-screen multi-view pattern with caveats** (Notes finding) — add an example to the Conditionals section showing `if selected is null: <list view> else: <detail view>` as a *tactical pattern for tightly coupled list/detail flows*. Make explicit that this is NOT the canonical architecture for multi-screen apps.
2. **Icon button example** (Music Player finding) — `icon "play", on tap: play_song()` in Built-in Primitives or Events.
3. **Functions as expressions** (Music Player finding) — one sentence in Functions: function calls return values that compose anywhere a value is expected.
4. **`image round` vs `layout rounded`** (Music Player finding) — one-line clarification.
5. **Cross-screen call rule** (Notes finding) — one explicit sentence stating that screens called via `navigate to` cannot call functions defined in the navigating screen, paired with pointers at (a) the single-screen pattern for cases that work and (b) v0.5's planned shared-state mechanism for cases that don't.

### v0.5 backlog (with the Notes findings incorporated)

- **Cross-screen shared state — DEMOTED FROM URGENT but NOT ELIMINATED.** Gemini's single-screen pattern proves v0.4 can handle the *specific* tightly-coupled-list-detail case via conditional rendering, which is genuinely useful and should be documented in v0.4.1. But the broader language limitation is real and was surfaced cleanly by Claude. v0.5 still needs to design a shared-state mechanism for the cases the single-screen pattern can't reach: apps with many screens, scenarios that need real navigation (back button / deep links / URL history), settings/auth/cart-style global state, and any case where forcing views into one file becomes unmaintainable.
- **Optimistic updates with rollback** — still v0.5. Tied to the broader async-mutation story, which depends on shared state.
- **Forms / animations / list search/filter/sort / routing patterns / theming / package system** — unchanged.

**New v0.5 sub-question raised by Notes:** how does Igni's eventual cross-screen state mechanism interact with `navigate to` / `navigate back` semantics? Specifically: when `navigate back` happens after a mutation in the detail screen, how does the list screen know to re-render? Claude correctly identified this; Gemini sidestepped it.

### Surprises from the v0.4 round

- **Chat passed cleanly across all three models** — first 100% clean test in the suite. The simple cases v0.4 was designed to handle are now handled.
- **Gemini adopted `is not empty`** after consistently inventing `==`/`!=` in v0.3.2 testing. The v0.4 documentation worked.
- **Claude's honest "no" on Notes** is more useful than any clever workaround would have been. Long-term language design needs models that correctly identify what can't be done.
- **The icon-button pattern** is fully supported by v0.4 (universal `on tap:`) but not shown explicitly. Claude didn't find it on its own; the other two models did.
- **None of the three models attempted scroll-to-bottom** in Chat. Real chat apps need it, but no model treated it as v0.4's responsibility.

### Methodology notes for v0.4.1+ rounds

- The "Respond with only the Igni code" directive continues to work. Keep it.
- Claude's tendency to be honest about limitations should be **encouraged**, not framed as a failure. A test where Claude says "this can't be done" with a clear reason is more valuable than a test where all three models pass via different inventions.
- Cross-test patterns (e.g., 2/3 models using a feature naturally) are stronger evidence than single-test patterns. The `is X` finding required 4/6 data points across two apps before becoming a slam-dunk for v0.4.

## Methodology notes

- Spec version tested: `spec/v0.4.md`
- Prompts source: `tests/v0.4/prompts.md` (sections 4, 5, 6)
- Each model tested in a fresh chat conversation: no system prompt, no prior context, no custom instructions enabled
- Outputs captured into `tests/v0.4/<App>.md` per the test methodology in `tests/README.md`
- **Verdict criteria:** PASS = zero inventions across all models; PARTIAL = at least one model invents but inventions are minor or v0.5-deferrable; MIXED = different models take fundamentally different approaches with different verdicts; FAIL = multiple models invent things v0.4 should have covered

## Pointers

- Per-test result files: `tests/v0.4/Chat.md`, `MusicPlayer.md`, `Notes.md`
- Prompts used: `tests/v0.4/prompts.md`
- Spec snapshot tested: `spec/v0.4.md`
- v0.3.2 backlog (the source of v0.4): `tests/v0.3.2/summary.md`
