# Igni Test Suite

This folder contains the cold-LLM test infrastructure for Igni. Each test puts the current spec into a fresh frontier-model conversation and asks it to write a real app, then grades the result against a fixed rubric.

The point of these tests is **not** to demonstrate the spec works on cherry-picked easy cases. The point is to find the gaps the spec author can't see because they're too close to it.

## How to run a test

For each combination of (app × model):

1. **Open a fresh conversation** in the target LLM (Claude.ai, Gemini, ChatGPT). Actually fresh — new thread, no system prompt, no prior messages, no custom instructions enabled. Contamination from earlier context kills the test.
2. **Paste the full spec verbatim.** Copy the entire current `Igni_Language_Spec_v*.md` file (currently v0.3.2). No editing. No commentary. No "here's a language I designed."
3. **In the same message**, paste the prompt verbatim from `prompts.md`. **If the model asks follow-up questions, don't answer them** — that refusal-to-commit is itself a finding.
4. **Capture the entire response** (code plus any narration) into the matching `Cold_Test_<App>_v<spec_version>.md` file under the appropriate model's section.
5. **Note metadata:** date, model version, whether the output came in one shot or got split across messages.

## Grading rubric

For each output, three questions:

1. **Did it invent syntax that's not in the spec?** → spec has a gap. The missing thing needs to be added, or the existing syntax needs to be more discoverable.
2. **Did it use existing syntax wrong?** → spec is ambiguous. The rule needs to be more emphatic, or needs a counter-example showing what NOT to do.
3. **Did it produce valid Igni on the first try?** → spec works for this case. But still check 1 and 2 even on "valid" outputs — subtle wrongness still counts.

A "gap" includes both LLM inventions AND your own `# GAP:` comments from hand-written attempts of the same app. Both are evidence of the same underlying spec defect.

## Test order and pacing

Run apps in this order, one app per session, across all three models:

1. **Calculator** — state, events, nested layouts. Predicted gaps: comparison operators, number/string handling.
2. **Todo list** — lists, add/remove, bind. Predicted gaps: list mutation patterns, possibly filter/find.
3. **Weather app** — async fetch, loading/error, real API patterns. Should mostly use existing v0.3.2 features.
4. **Chat interface** — list of messages, input clearing after send. Predicted gaps: clearing inputs programmatically, scroll behaviour.
5. **Music player** — already partially tested in the comparison case. Formalises the result.

**Don't do all five in one sitting.** One app per session, write up the results before moving to the next. The gaps overlap and you'll see which ones are actually load-bearing vs theoretical.

**After three apps, stop and look at the gap list before continuing.** Don't rush v0.4.

## Files in this folder

- `README.md` — this file (test methodology and protocol).
- `prompts.md` — all five test prompts in one place. Self-contained, ready to paste.
- `Cold_Test_<App>_v<spec_version>.md` — one per app per spec version. Holds Claude, Gemini, GPT outputs and per-output grading.
- `v<spec_version>_summary.md` — aggregates findings across all five apps for that spec version. Becomes the next version's backlog.

## Practical notes

- **Use the chat UI, not the API.** Chat UI is what real developers use; it's the truest test. Move to API only if you need to scale beyond ~50 runs.
- **Don't prompt-engineer mid-test.** When a model produces wrong output, the temptation is to add "make sure to use `is loading`." Resist it. Add the issue to the gap list and let the spec do the work.
- **Capture line counts.** Spec line count vs LLM output line count is part of the pitch and worth tracking per app.
- **Each spec version gets its own set of test result files.** When you ship v0.4, create `Cold_Test_Calculator_v0.4.md` etc. and run the suite again. The diff between v0.3.2 results and v0.4 results is the proof v0.4 fixed the right things.
