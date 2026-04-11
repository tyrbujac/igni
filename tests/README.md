# Igni Test Suite

This folder contains the cold-LLM test infrastructure for Igni. Each test puts the current spec into a fresh frontier-model conversation and asks it to write a real app, then grades the result against a fixed rubric.

The point of these tests is **not** to demonstrate the spec works on cherry-picked easy cases. The point is to find the gaps the spec author can't see because they're too close to it.

## How to run a test

For each combination of (app × model):

1. **Open a fresh conversation** in the target LLM (Claude.ai, Gemini, ChatGPT). Actually fresh — new thread, no system prompt, no prior messages, no custom instructions enabled. Contamination from earlier context kills the test.
2. **Paste the full current spec verbatim.** Currently `spec/v0.5.md`. No editing. No commentary. No "here's a language I designed."
3. **In the same message**, paste the prompt verbatim from the matching `tests/v<spec_version>/prompts.md` (e.g. `tests/v0.5/prompts.md`). **If the model asks follow-up questions, don't answer them** — that refusal-to-commit is itself a finding.
4. **Capture the entire response** (code plus any narration) into the matching test result file: `tests/v<spec_version>/<App>.md` (e.g. `tests/v0.5/Shopping.md`) under the appropriate model's section.
5. **Note metadata:** date, model version, whether the output came in one shot or got split across messages.

## Grading rubric

For each output, three questions:

1. **Did it invent syntax that's not in the spec?** → spec has a gap. The missing thing needs to be added, or the existing syntax needs to be more discoverable.
2. **Did it use existing syntax wrong?** → spec is ambiguous. The rule needs to be more emphatic, or needs a counter-example showing what NOT to do.
3. **Did it produce valid Igni on the first try?** → spec works for this case. But still check 1 and 2 even on "valid" outputs — subtle wrongness still counts.

A "gap" includes both LLM inventions AND your own `# GAP:` comments from hand-written attempts of the same app. Both are evidence of the same underlying spec defect.

**Special category: the honest "no".** If a model refuses to invent and explicitly identifies a gap (as Claude did with cross-screen state in the v0.4 Notes test), treat that as the most diagnostically useful output of the round. A model that correctly names what the spec *can't* do is more useful for designing the next version than a model that invents a workaround.

## Test apps

The full suite has grown over time. Each spec version's subfolder contains the prompts that were tested against it.

**v0.3.2 round (3 apps, all failed → fed v0.4 backlog):**

1. **Calculator** — state, events, nested layouts, screen-internal functions. Surfaced arithmetic operators, `is X` extension, operator precedence.
2. **Todo list** — lists, two-way bind, add/remove, per-item state. Surfaced list `+`, `without` removal, `each` in functions, functional updates.
3. **Weather app** — async fetch, loading/error/loaded states, re-fetch on input change. Validated the reactive read pattern; surfaced `null`.

**v0.4 acceptance round (3 apps, mixed verdict):**

4. **Chat interface** — list of messages, input clearing after send, scroll-to-bottom. **PASS** — first 100% clean test in the suite.
5. **Music player** — image, slider, conditional buttons, horizontal control row. **PARTIAL** — Claude over-engineered the icon button. Closed by v0.4.1 documentation.
6. **Notes app** — multi-screen navigation, list + detail + edit + delete + empty state. **MIXED** — surfaced cross-screen shared state as the v0.5 priority. Closed by v0.5 `shared:` block.

**v0.5 validation round (in progress):**

7. **Notes app re-run** — same prompt as v0.4 round, against v0.5. Validates that `shared:` state actually closes the cross-screen state gap that the v0.4 Notes test surfaced. The most important regression check in the suite.
8. **Shopping app** — new for v0.5. Multi-screen e-commerce (product list, product detail, cart) with shared state (`shared.cart`), wrapper components (`ProductCard` with `body` slot), and the new list builtins (`replace` for quantity updates, `find` by id, `is in` cart membership, `length` for total items). Exercises all three v0.5 features in a single test.

**Don't run all of them in one sitting.** One app per session, write up the results before moving to the next. The gaps overlap and you'll see which ones are actually load-bearing vs theoretical.

## Folder layout

```text
tests/
├── README.md                  # this file (test methodology)
├── v0.3.2/                    # tests run against the v0.3.2 spec
│   ├── prompts.md
│   ├── Calculator.md          # complete
│   ├── Todo.md                # complete
│   ├── Weather.md             # complete
│   └── summary.md             # cross-app aggregation that fed the v0.4 backlog
├── v0.4/                      # tests run against the v0.4 spec
│   ├── prompts.md
│   ├── Chat.md                # PASS
│   ├── MusicPlayer.md         # PARTIAL
│   ├── Notes.md               # MIXED
│   └── summary.md             # final v0.4 acceptance summary
└── v0.5/                      # tests run against the v0.5 spec (current)
    ├── prompts.md             # Notes re-run + new Shopping app
    ├── Notes.md               # validation re-run, pending
    └── Shopping.md            # acceptance test, pending
```

Each spec version gets its own subfolder containing both the prompts that were tested against it AND the result files. Test result filenames inside drop both the version (the folder carries it) and the `Cold_Test_` prefix.

## Practical notes

- **Use the chat UI, not the API.** Chat UI is what real developers use; it's the truest test. Move to API only if you need to scale beyond ~50 runs.
- **Don't prompt-engineer mid-test.** When a model produces wrong output, the temptation is to add "make sure to use `shared.cart`." Resist it. Add the issue to the gap list and let the spec do the work.
- **Capture line counts.** Spec line count vs LLM output line count is part of the pitch and worth tracking per app.
- **Each spec version gets its own subfolder.** When you ship a new version, create the next folder with its own `prompts.md` (a copy of the prompts you actually want to run against it) and run the suite again. The diff between two version folders is the proof that the new version fixed the right things.
- **v0.5 is the last design-only round.** After v0.5 cold tests validate, the next workstream is the TypeScript-to-Dart transpiler against v0.5. The test suite stays in active use against future spec versions, but v0.6 design work is paused until the transpiler is real.
