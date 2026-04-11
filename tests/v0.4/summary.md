# Igni v0.4 — Cold-LLM Test Summary

**Spec version:** v0.4
**Test suite run:** 2026-04-11 (in progress: 1 of 3 complete)
**Apps tested:** Chat (complete), Music Player (pending), Notes (pending)
**Models tested:** Claude Opus 4.6, Gemini Thinking 3.0, ChatGPT (free tier)

## Headline result so far

**Chat passed cleanly across all three models with zero inventions** — the **first 100% clean test in the entire test suite history.** Calculator, Todo, and Weather under v0.3.2 all had at least one universal invention. Chat is the first time the spec covers a use case so completely that no model reaches outside it.

The most important finding is that **Gemini finally adopted `is not empty`** instead of inventing `==`/`!=`. In Calculator and Todo, Gemini was the consistent equality outlier (used `==`/`!=` while Claude and ChatGPT extended `is X`). In Chat against v0.4, Gemini wrote `if draft is not empty:`. **The v0.4 documentation of `is X` for arbitrary equality empirically captured Gemini's preference.** The equality gap is now closed across all three models, not just two.

The remaining two tests (Music Player and Notes) will determine whether v0.4 can ship as the stable release.

## Apps × models matrix

| App           | Claude Opus 4.6 | Gemini Thinking 3.0 | ChatGPT (free) | Verdict |
|---|---|---|---|---|
| Chat          | **Y**            | **Y**                | **Y**           | **PASS** (zero inventions) |
| Music Player  | _pending_        | _pending_            | _pending_       | _pending_ |
| Notes         | _pending_        | _pending_            | _pending_       | _pending_ |

Legend: **Y** = valid Igni first-try, no inventions. **N** = failed (invented syntax). **~** = valid but with subtle issues.

## Confirmed v0.4 wins (from Chat)

These v0.4 changes were validated empirically by the Chat test:

1. **`is X` for arbitrary equality** — All three models used `is not empty` for the draft check. **Gemini in particular** had been the consistent equality outlier in v0.3.2 testing; in Chat it adopted `is not empty` naturally. The v0.4 documentation worked.
2. **Reactive input clearing** — All three models cleared the input via `draft = ""` (just reassign the bound variable). The "predicted gap" of a `clear()` method invention didn't materialize. The two-way `bind` model is intuitive.
3. **List append with `+`** — All three used `messages = messages + [{...}]`. Universal pattern, exactly as v0.4 specifies.
4. **Object literals in append context** — All three constructed message objects inline with `{sender: "...", text: "..."}`. v0.4 object literal syntax landed cleanly.
5. **Functions inside screens close over state** — All three defined `send()` / `send_message()` inside the screen and freely mutated `messages` and `draft`.
6. **Component extraction is encouraged but not enforced** — 2/3 models (Claude, Gemini) extracted `MessageBubble`. ChatGPT inlined. Both forms are valid; the readability hint nudges without coercing.

## Gaps observed (from Chat)

**None.** Zero gaps. First clean test in the suite.

The two predicted gaps both resolved without intervention:

- **Input clearing**: `draft = ""` is the obvious answer once you understand reactive `bind`. Not a gap.
- **Scroll-to-bottom**: not attempted by any model. Treated as out-of-scope rather than invented. Worth a v0.5 feature consideration but not a v0.4 defect.

## Per-model observations (Chat round)

### Claude Opus 4.6

- Extracted `MessageBubble` as a component (cleanest decomposition).
- Added `color: brand` styling to the send button.
- Used `is not empty` and `draft = ""` cleanly.
- ~19 lines.

### Gemini Thinking 3.0

- Extracted `MessageBubble` as a component.
- Seeded the messages list with an initial system message (`"Welcome to Igni Chat v0.4"`).
- **First test in the suite where Gemini used `is not empty`** instead of inventing `==`/`!=`. The v0.4 `is X` documentation captured Gemini's preference at last.
- ~22 lines.

### ChatGPT (free)

- Inlined message rendering instead of extracting a component (still valid; component extraction is a hint, not a rule).
- Most compact output of the three (~17 lines).
- Used `is not empty` and `draft = ""` cleanly.

## Cross-test progress (v0.3.2 → v0.4)

Combined view across both spec versions:

| Test | Spec | Models | Verdict | Inventions |
|---|---|---|---|---|
| Calculator | v0.3.2 | 3 | FAIL → fed v0.4 backlog | Universal: arithmetic operators, equality (2/3 used `is X`); per-model: type conversion, truthiness |
| Todo | v0.3.2 | 3 | FAIL → fed v0.4 backlog | Universal: list `+`, list removal; per-model: `without`, `each` in functions, `continue`, `color: x and y`, in-place mutation |
| Weather | v0.3.2 | 3 | PARTIAL → fed v0.4 backlog | Universal: number+string `+`; per-model: `null`, manual state vs reactive read |
| **Chat** | **v0.4** | **3** | **PASS** | **None** |
| Music Player | v0.4 | _pending_ | _pending_ | _pending_ |
| Notes | v0.4 | _pending_ | _pending_ | _pending_ |

**12 independent data points so far** (4 apps × 3 models). The first three apps fed the v0.4 backlog; v0.4 is now being validated against three more apps (Chat done, two pending).

## Conclusions and v0.5 priorities (so far)

After Chat:

- **v0.4 ships unchanged** for chat-app use cases. No patches needed for what Chat exercises.
- **Potential v0.5 features identified by Chat:** scroll-to-bottom for long lists (not attempted by any model, but real chat apps need it). Lower priority than the cross-screen state question that Notes is expected to surface.

After Music Player and Notes are complete, this section will be updated with the full v0.5 backlog. The biggest open question is whether Notes surfaces cross-screen state as a real design driver (predicted) or whether the models find a clean pattern using existing primitives (which would be a major win for v0.4).

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
