# Igni Test Suite

This folder contains the cold-LLM test infrastructure for Igni. Each test puts the current spec into a fresh frontier-model conversation and asks it to write a real app, then grades the result against a fixed rubric.

The point of these tests is **not** to demonstrate the spec works on cherry-picked easy cases. The point is to find the gaps the spec author can't see because they're too close to it.

## How to run a test

For each combination of (app × model):

1. **Open a fresh conversation** in the target LLM (Claude.ai, Gemini, ChatGPT). Actually fresh — new thread, no system prompt, no prior messages, no custom instructions enabled. Contamination from earlier context kills the test.
2. **Paste the full current spec verbatim.** Currently `spec/v0.7.0.md` (or the current cheatsheet when running a cheatsheet-only round). No editing. No commentary. No "here's a language I designed."
3. **In the same message**, paste the prompt verbatim from the matching `tests/v<spec_version>/prompts.md` (e.g. `tests/v0.5/prompts.md`). **If the model asks follow-up questions, don't answer them** — that refusal-to-commit is itself a finding.
4. **Capture the entire response** (code plus any narration) into the matching test result file: `tests/v<spec_version>/<App>.md` (e.g. `tests/v0.5/Shopping.md`) under the appropriate model's section.
5. **Note metadata:** date, model version, whether the output came in one shot or got split across messages.

### Step 2: Transpiler validation (new)

Now that the transpiler exists, LLM output can be objectively validated:

6. **Save the LLM's Igni code** to a `.igni` file.
7. **Run it through the transpiler:** `npx tsx src/cli.ts <file>.igni`
   - If it transpiles → paste the Dart output into `test_app/lib/main.dart` and run `flutter run -d chrome`.
   - If it fails → the error message tells you exactly what Igni feature the transpiler doesn't support yet or what the LLM got wrong.
8. **Record both results** in the test file: the spec-level grading (inventions, misuse, valid) AND the transpiler result (transpiles, runs, errors).

This is the key upgrade over spec-only testing. Before, "valid Igni" was a subjective judgment. Now it's an objective test — the code either compiles and runs or it doesn't. Transpiler errors also directly prioritise what to build next: if 2/3 models use a feature the transpiler doesn't handle, that feature moves to the top of the backlog.

**Most LLM output transpiles zero-fix.** Across the current cold-test suite, the dominant pattern is now "first output compiles" rather than "manual repair required." The transpiler covers almost all of the current language surface used in tests — screens, components, wrapper components, layouts, conditionals, loops, functions, lambdas, navigation, shared state, fetch, mutations, reactive re-fetch, list operations, list indexing, images/audio, and more. The notable remaining spec-defined gaps are still `theme:` blocks and `paginate:` on `each`.

## Latest result: v0.7.0 styling-tokens-as-values

The v0.7.0 round is the strongest methodology result in the repo so far, and the first application of the narrower-hypothesis methodology announced at the end of v0.6.11:

- **Feature landed 4/4 on all three axes.** Value reassignment, function-returns-colour, and component-takes-colour-argument each produced 4/4 unanimous adoption across Gemini 3 Flash, Gemini 3.1 Pro, GPT 5.3, and Claude Opus 4.6.
- **Largest v0.x → v0.(x+1) convergence jump in project history.** BMI rerun against the identical v0.6.11 prompt: 0/4 → 4/4 on `status_color = green`. The single longest-running signal of the v0.6.x series closed in one version.
- **Two-stream validation.** Cold-test data (what models produce) and qualitative-review data (what models critique) converged on the same gaps when both were run against the same version. The methodology going forward is one cold-test round plus one ship-review round per version, with priority ordering backed by compounded signal rather than either stream alone.
- **Two new gap signals surfaced:** string case conversion (4/4 Alert Dashboard friction + 4/4 ship-review flags = 8/8 compounded — strongest evidence in project history, v0.7.1 candidate) and event handlers as component arguments (2/4 BMI invention + 3/4 ship-review flags = 5/8 — leading v0.8 design question).
- **No regressions.** All v0.6.x patches held: `round()` 4/4, `shape: circle` 4/4, bottom-anchor pattern ~3/4. First v0.x → v0.(x+1) transition where the new feature landed and nothing prior slipped.

The detailed write-ups live in `tests/v0.7.0/BMI_Calculator.md` and `tests/v0.7.0/Alert_Dashboard.md`.

## Previous landmark result: v0.6.11 BMI methodology experiment

The v0.6.11 BMI re-run closed the v0.6.x patch arc with three categorically different additions all landing:

- **Named additions propagate almost perfectly.** `round(value, places)` went from `0/4` usage in `v0.6.8` to `4/4`. `shape: circle` on `button` landed `4/4` on first exposure.
- **Documentation-only patches also move behaviour.** The bottom-anchored actions pattern (`fill: true` on content sections so the CTA sits at the bottom) went from `0/4` to roughly `3.5/4` with no new syntax.
- **This validates the spec-budget principle.** Many gaps can be closed by documentation and worked examples instead of adding new keywords.

The detailed write-up lives in `tests/v0.6.11/BMI_Calculator.md`.

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

**v0.5 validation round (complete):**

7. **Notes app re-run** — same prompt as v0.4 round, against v0.5. **PASS** — clean across all three models. Cross-screen state gap closed.
8. **Shopping app** — new for v0.5. **PARTIAL** — Gemini PASS, Claude/ChatGPT misused `find` for structural matching. Closed by v0.5.1 docs patch.

**v0.5.1 transpiler-validated round:**

9. **Settings screen** — first transpiler-validated test. Input binding, toggle binding, button, layout.
10. **Greeting screen** — conditional rendering test.

**v0.6.2 round (first end-to-end 3-model + transpiler test):**

11. **Contacts** — list filtering, navigation, detail screen. First test where LLM output was run through the transpiler and tested in the browser.

**v0.6.3 round (3/3 zero-fix):**

12. **Contacts re-run** — same prompt as v0.6.2. After type hint transpiler support, 3/3 zero-fix. Last transpiler gap for this app closed.

**v0.6.4 round (Angela Yu course projects, 4/4 zero-fix):**

13. **Dicee** — two-dice roller. State, local images, `random()`, screen properties. **4/4 zero-fix.** 13 lines vs 56 lines Flutter (4.3x reduction). Drove: screen properties, local images, extended colours, `fill: true`, AppBar.
14. **Xylophone** — seven coloured bars, tap to play notes. **4/4 transpile** (2 minor fixes). 10 lines vs 45 lines Flutter (4.5x reduction). Drove: `play()` audio builtin, `audio/` folder, `teal` colour, empty layout blocks.

**v0.6.5 round (Quizzler — list indexing gap and resolution):**

15. **Quizzler (pre-indexing)** — true/false quiz. Run before `list[index]` existed. **4 distinct approaches** — 2/4 invented `questions[index]`, strongest gap signal in the project. Divergence-as-signal methodology validated.
16. **Quizzler (post-indexing)** — same prompt after adding `list[index]` to spec. **4/4 zero-fix.** Convergence restored. ~45 lines vs ~120 lines Flutter (~2.7x reduction).
17. **Quizzler (cheatsheet-only)** — same prompt, v0.6.5-cheatsheet.md only (300 lines, 70% smaller than full spec). **3/4 correct** (1 scoping error). Key finding: cheatsheet produces structurally identical outputs to full spec.

**v0.6.6 round (Destini — cheatsheet-only, branching logic):**

18. **Destini** — choose-your-own-adventure story game. v0.6.6-cheatsheet.md only. **3 distinct architectures** — 3/4 data-driven, 1 hardcoded if/else. Surfaced background image gap (4/4 models). Cheatsheet-only continues to work.

**v0.6.7-v0.6.11 BMI sequence (methodology experiment):**

19. **BMI Calculator (v0.6.7)** — exploratory baseline. Surfaced multiple styling and layout gaps plus several transpiler bugs.
20. **BMI Calculator (v0.6.8)** — same app after the `body` slot change and transpiler fixes. Closed the wrapper crash by construction and isolated the surviving signals more clearly.
21. **BMI Calculator (v0.6.11)** — same prompt, same four models, after three non-breaking patches. **All three additions changed output.** This is the clearest evidence yet that Igni's spec can be improved by a mix of syntax changes and documentation-only patches.

**v0.7.0 narrower-hypothesis round (styling-tokens-as-values, 4/4 across both prompts):**

22. **BMI Calculator (v0.7.0)** — identical-to-v0.6.11 prompt. **4/4 spontaneous `status_color = green` adoption**, closing the single longest-running signal from the v0.6.x series. 4/4 on `bg = card` for gender-card selection backgrounds. No regressions on any prior v0.6.x addition. 2/4 independently invented syntax for first-class event handlers as component arguments — strongest unresolved structural signal for v0.8.
23. **Alert Dashboard (v0.7.0)** — new prompt targeting the architecture-flow patterns the spec added examples for (function-returns-colour, component-takes-colour-argument). 4/4 on both axes. 4/4 hit the missing `upper()` builtin in four distinct ways — strongest compounded signal in project history (8/8 with ship review), v0.7.1 candidate.

**Don't run all of them in one sitting.** One app per session, write up the results before moving to the next.

## Cheatsheet-only methodology

Starting with v0.6.5, tests can be run against the cheatsheet (~300 lines) instead of the full spec (~1100 lines). The v0.6.5 cheatsheet-only Quizzler test showed that **the 300-line cheatsheet produces structurally identical outputs to the 1100-line full spec** — approximately 70% of the full spec is explanatory context that aids human comprehension but isn't required for LLM code generation.

The cheatsheet is now the primary document for LLM consumption. Cold tests should run against both formats when validating a new spec version. After the v0.6.11 BMI methodology experiment, the project has enough evidence that future cold tests can be narrower and hypothesis-driven rather than broad re-runs of the whole app suite.

## Folder layout

```text
tests/
├── README.md                  # this file (test methodology)
├── v0.3.2/                    # Calculator, Todo, Weather — fed v0.4 backlog
├── v0.4/                      # Chat (PASS), MusicPlayer (PARTIAL), Notes (MIXED)
├── v0.5/                      # Notes re-run (PASS), Shopping (PARTIAL)
├── v0.5.1/                    # Settings, Greeting (first transpiler-validated)
├── v0.6/                      # Contacts, Shopping (post-transpiler)
├── v0.6.1/                    # Todo, Dashboard, Shopping
├── v0.6.2/                    # Contacts (first end-to-end 3-model + transpiler test)
├── v0.6.3/                    # Contacts re-run (3/3 zero-fix after type hints)
├── v0.6.4/                    # Dicee (4/4), Xylophone (4/4)
├── v0.6.5/                    # Quizzler (4/4 post-indexing), Quizzler-Cheatsheet (3/4)
├── v0.6.6/                    # Destini (cheatsheet-only, 3 architectures)
├── v0.6.7/                    # BMI exploratory baseline
├── v0.6.8/                    # BMI delta after body-slot change
├── v0.6.11/                   # BMI methodology experiment
└── v0.7.0/                    # BMI rerun (4/4) + Alert Dashboard (4/4) — styling-tokens feature landed
```

Each spec version gets its own subfolder containing both the prompts that were tested against it AND the result files. Test result filenames inside drop both the version (the folder carries it) and the `Cold_Test_` prefix.

## Practical notes

- **Use the chat UI, not the API.** Chat UI is what real developers use; it's the truest test. Move to API only if you need to scale beyond ~50 runs.
- **Don't prompt-engineer mid-test.** When a model produces wrong output, the temptation is to add "make sure to use `shared.cart`." Resist it. Add the issue to the gap list and let the spec do the work.
- **Capture line counts.** Spec line count vs LLM output line count is part of the pitch and worth tracking per app.
- **Each spec version gets its own subfolder.** When you ship a new version, create the next folder with its own `prompts.md` (a copy of the prompts you actually want to run against it) and run the focused tests you actually need. The diff between two version folders is the proof that the new version fixed the right things.
- **The transpiler is real.** After cold-testing, try running LLM output through `npx tsx src/cli.ts <file>.igni` in the `transpiler/` directory. The transpiler now covers almost all of the language surface exercised by the suite; when it fails, the error tells you exactly what to build next. See "Step 2: Transpiler validation" above.
- **Record both grades.** Test result files should now include the spec-level grading (inventions, misuse, valid) AND the transpiler result (transpiles, runs, errors). Two-stage validation is the new workflow.
