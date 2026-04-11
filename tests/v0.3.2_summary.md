# Igni v0.3.2 — Cold-LLM Test Summary

**Spec version:** v0.3.2
**Test suite run:** _(date range, fill in when complete)_
**Apps tested:** Calculator, Todo, Weather, Chat, Music Player
**Models tested:** Claude, Gemini, GPT

## Headline result

_(One paragraph: did v0.3.2 pass the suite? How many apps produced compilable Igni first-try across how many models? Any major failure modes worth flagging?)_

## Apps × models matrix

| App           | Claude | Gemini | GPT  |
|---------------|--------|--------|------|
| Calculator    | _?_    | _?_    | _?_  |
| Todo          | _?_    | _?_    | _?_  |
| Weather       | _?_    | _?_    | _?_  |
| Chat          | _?_    | _?_    | _?_  |
| Music Player  | _?_    | _?_    | _?_  |

Legend: **Y** = valid Igni first-try / **N** = failed (invented syntax or used existing wrong) / **~** = valid but with subtle issues that should still feed the gap list.

## Aggregated gaps (the v0.4 backlog)

Ranked by how many tests surfaced each issue. A gap that appeared in 5 apps is more urgent than one that appeared in 1. Each gap should reference which `Cold_Test_*.md` files it came from.

1. _(e.g. "Comparison operators — surfaced in: Calculator, Todo (filter), Chat (validation). Recommended fix: extend `is` to include `is equal to`, or commit to `==`/`!=` and add to spec.")_
2. _(...)_

## Per-model observations

### Claude

_(Anything systematic about how Claude tended to interpret the spec, what it consistently got right vs wrong, where it leaned on familiar patterns from other languages, etc.)_

### Gemini

_(Same — patterns specific to Gemini's behaviour across the suite.)_

### GPT

_(Same — patterns specific to GPT's behaviour across the suite.)_

## Line count comparison vs Flutter

Quantifies the readability win. For each app, write the LLM-generated Igni alongside an equivalent hand-written Flutter version and compare.

| App           | Igni LOC | Flutter LOC | Ratio |
|---------------|----------|-------------|-------|
| Calculator    | _?_      | _?_         | _?_   |
| Todo          | _?_      | _?_         | _?_   |
| Weather       | _?_      | _?_         | _?_   |
| Chat          | _?_      | _?_         | _?_   |
| Music Player  | _?_      | _?_         | _?_   |

Average ratio: _(?)_

## Conclusions and v0.4 priorities

After running the suite, the top priorities for v0.4 are:

1. _(highest-impact gap, ranked by how many apps it broke)_
2. _(...)_
3. _(...)_

**Deferred to v0.5 or later:**

- _(gaps that appeared in only one app, or that aren't blocking anything)_

**Surprises:**

- _(things that worked unexpectedly well)_
- _(things that broke unexpectedly badly)_

**Methodology notes for next round:**

- _(anything about the test process itself worth changing for v0.4 testing)_
