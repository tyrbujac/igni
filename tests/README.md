# Igni Test Suite

This folder contains the cold-LLM test infrastructure for Igni. Each test puts the current spec into a fresh frontier-model conversation and asks it to write a real app, then grades the result against a fixed rubric.

The point of these tests is **not** to demonstrate the spec works on cherry-picked easy cases. The point is to find the gaps the spec author can't see because they're too close to it.

## How to run a test

For each combination of (app × model):

1. **Open a fresh conversation** in the target LLM (Claude.ai, Gemini, ChatGPT). Actually fresh — new thread, no system prompt, no prior messages, no custom instructions enabled. Contamination from earlier context kills the test.
2. **Paste the full current spec verbatim.** Currently `spec/v0.4.md`. No editing. No commentary. No "here's a language I designed."
3. **In the same message**, paste the prompt verbatim from the matching `tests/v<spec_version>/prompts.md` (e.g. `tests/v0.4/prompts.md`). **If the model asks follow-up questions, don't answer them** — that refusal-to-commit is itself a finding.
4. **Capture the entire response** (code plus any narration) into the matching test result file: `tests/v<spec_version>/<App>.md` (e.g. `tests/v0.4/Notes.md`) under the appropriate model's section.
5. **Note metadata:** date, model version, whether the output came in one shot or got split across messages.

## Grading rubric

For each output, three questions:

1. **Did it invent syntax that's not in the spec?** → spec has a gap. The missing thing needs to be added, or the existing syntax needs to be more discoverable.
2. **Did it use existing syntax wrong?** → spec is ambiguous. The rule needs to be more emphatic, or needs a counter-example showing what NOT to do.
3. **Did it produce valid Igni on the first try?** → spec works for this case. But still check 1 and 2 even on "valid" outputs — subtle wrongness still counts.

A "gap" includes both LLM inventions AND your own `# GAP:` comments from hand-written attempts of the same app. Both are evidence of the same underlying spec defect.

## Test apps

Six apps in the suite, in order of escalating complexity:

1. **Calculator** — state, events, nested layouts, screen-internal functions. Tested against v0.3.2; surfaced arithmetic operators, `is X` extension, operator precedence. All closed by v0.4.
2. **Todo list** — lists, two-way bind, add/remove, per-item state. Tested against v0.3.2; surfaced list `+`, `without` removal, `each` in functions, functional updates. All closed by v0.4.
3. **Weather app** — async fetch, loading/error/loaded states, re-fetch on input change. Tested against v0.3.2; validated the reactive read pattern (2/3 models found it cold), surfaced `null`. All closed by v0.4.
4. **Chat interface** — list of messages, input clearing after send, scroll-to-bottom. v0.4 acceptance test; predicted gaps: clearing inputs programmatically, scroll behaviour.
5. **Music player** — image, slider, conditional buttons, horizontal control row. v0.4 acceptance test; expected to pass cleanly (happy-path baseline).
6. **Notes app** — multi-screen navigation, list + detail + edit + delete + empty state. v0.4 acceptance test; **first test in the suite that requires multi-screen navigation.** Expected to surface cross-screen state as the v0.5 design driver.

**Don't run all six in one sitting.** One app per session, write up the results before moving to the next. The gaps overlap and you'll see which ones are actually load-bearing vs theoretical.

## Folder layout

```text
tests/
├── README.md                  # this file (test methodology)
├── v0.3.2/                    # tests run against the v0.3.2 spec
│   ├── prompts.md             # the three prompts that were tested against v0.3.2
│   ├── Calculator.md          # complete
│   ├── Todo.md                # complete
│   ├── Weather.md             # complete
│   └── summary.md             # cross-app aggregation that fed the v0.4 backlog
└── v0.4/                      # tests run against the v0.4 spec (current)
    ├── prompts.md             # the three prompts being run as v0.4 acceptance tests
    ├── Chat.md                # acceptance test, pending
    ├── MusicPlayer.md         # acceptance test, pending
    └── Notes.md               # acceptance test, pending — first multi-screen test
```

Each spec version gets its own subfolder containing both the prompts that were tested against it AND the result files. Test result filenames drop both the version (the folder carries it) and the `Cold_Test_` prefix (the folder + filename together communicate the test identity).

## Practical notes

- **Use the chat UI, not the API.** Chat UI is what real developers use; it's the truest test. Move to API only if you need to scale beyond ~50 runs.
- **Don't prompt-engineer mid-test.** When a model produces wrong output, the temptation is to add "make sure to use `is loading`." Resist it. Add the issue to the gap list and let the spec do the work.
- **Capture line counts.** Spec line count vs LLM output line count is part of the pitch and worth tracking per app.
- **Each spec version gets its own subfolder.** When you ship v0.5, create `tests/v0.5/` with its own `prompts.md` (a copy of the prompts you actually want to run against v0.5) and run the suite again. The diff between two version folders is the proof that the new version fixed the right things.
