# Igni v0.5 — Cold-LLM Test Summary

**Spec version:** v0.5
**Test suite run:** 2026-04-11 (complete: 2 of 2)
**Apps tested:** Notes (re-run from v0.4), Shopping (new for v0.5)
**Models tested:** Claude Opus 4.6, Gemini 3.1 Pro, ChatGPT (free tier)

## Headline result

**v0.5 ships as the stable release with a queued v0.5.1 documentation patch.**

- **Notes (re-run): clean PASS.** All three models, zero inventions. Transforms the v0.4 MIXED verdict into a clean PASS — empirical proof that the `shared:` block design landed and is universally discoverable. The cross-screen state gap that motivated v0.5 is closed.
- **Shopping (new): PARTIAL.** Gemini PASS with the cleanest output of the test (creative use of `count` for quantity tracking and a clean `body`-slot wrapper). Claude and ChatGPT both PARTIAL — same `find` misuse (treating `find` as structural/key-based matching when the spec defines it as identity-based). This is a real spec ambiguity that the prompt surfaced.

The Shopping PARTIAL is **diagnostically useful**, not concerning: Gemini's clean output proves v0.5 is correct and discoverable; Claude and ChatGPT's misuses point at a specific documentation gap that a v0.5.1 patch closes.

## Apps × models matrix

| App           | Claude Opus 4.6 | Gemini 3.1 Pro | ChatGPT (free) | Verdict |
|---|---|---|---|---|
| Notes (re-run from v0.4) | **Y** | **Y** | **Y** | **PASS** (zero inventions) |
| Shopping | **N** (`find` misuse) | **Y** (cleanest output of the test) | **N** (`find` misuse + `spread:` ambiguity + no-arg component) | **PARTIAL** |

Legend: **Y** = valid Igni first-try, no inventions. **N** = failed (invented syntax or used existing wrong). **~** = valid but with subtle issues.

## Confirmed v0.5 wins

Validated empirically across both Notes and Shopping:

1. **`shared:` block universally discoverable.** All six (3 models × 2 tests) used it correctly. The `shared.X` prefix at every use site was clear and didn't trip any model. Closes the cross-screen state gap from v0.4 acceptance.
2. **`replace` universally discoverable for the canonical case.** All three models in Notes used `replace(shared.notes, note, {...})` for the save operation. (In Shopping, two of three models used `replace` in syntactically valid forms but in branches that never fired due to the `find` misuse.)
3. **`without` works cleanly.** All six runs used it correctly for delete/remove operations.
4. **`is empty`, `is not empty`, `is in`, `is not in`** — all used correctly across both tests.
5. **`length` and `count`** — Gemini used both in Shopping for the badge count and quantity tracking respectively. The other models didn't reach for them but didn't misuse them either.
6. **`body` slot wrapper** — 2/3 models in Shopping (Claude and Gemini) used it correctly with two different valid styles. ChatGPT missed the link between "wrapper component" terminology and the `body` keyword.
7. **Gemini abandoned the v0.4 single-screen workaround** in Notes. When given the canonical `shared:` mechanism, models prefer the multi-screen + shared state approach over the workaround. This validates the v0.4.1 framing of the single-screen pattern as tactical, not canonical.
8. **Claude went from "honest no" to "clean yes"** in Notes. The most diagnostically useful negative result in the v0.4 round became the most validating positive result in the v0.5 round. **The spec design responded to the real signal.**

## Gaps observed — the v0.5.1 docs patch backlog

### From Notes — none

Zero gaps. Clean PASS.

### From Shopping — five documentation gaps

1. **`find` is identity-based, not structural** (Claude + ChatGPT, 2/3 models). Both reached for the JavaScript `Array.find(item => item.id === id)` mental model. The spec says `find` is identity-based but the warning isn't strong enough; the term "find" naturally suggests a key-based search. **Highest-priority v0.5.1 fix.** Add an explicit warning with a concrete counter-example showing `find(list, {id: x})` does NOT work.

2. **`spread:` syntax is ambiguous** (ChatGPT only). The spec lists `spread (space-between)` as a layout property. Claude and Gemini interpreted as boolean (`spread: true`); ChatGPT interpreted as token (`spread: space-between`). **v0.5.1 fix:** pick one form (recommend boolean) and document it explicitly.

3. **"Wrapper component" terminology doesn't reliably map to `body`** (ChatGPT only). ChatGPT defined `ProductCard` as a regular component when the prompt asked for a wrapper. **v0.5.1 fix:** add a one-line cross-reference: *"A 'wrapper component' is a component that uses the `body` keyword to render caller-provided content."*

4. **`count` for quantity tracking is the right idiom but undocumented** (Gemini's insight). Gemini sidesteps the find-by-key problem by storing duplicates and using `count(list, item)` to compute quantity. This is the canonical v0.5 pattern for "how many of each." **v0.5.1 fix:** add Gemini's pattern as an example in the Lists section.

5. **No-arg component invocation form is undocumented** (ChatGPT only). ChatGPT used `CartIcon` (no args, no parens) at multiple call sites. The spec doesn't explicitly bless this. **v0.5.1 fix:** one-line note clarifying that no-arg components are invoked by name alone.

All five are documentation-only, no new language features. Total budget impact: zero. Recommend shipping all five as a single v0.5.1 patch.

## Per-model observations

### Claude Opus 4.6

- **Notes:** Clean PASS. Used `shared:` with type annotation, `replace` for save, `without` for delete. The cleanest of the three Notes outputs structurally. **Major shift from v0.4** where Claude refused to invent and explicitly named the gap.
- **Shopping:** PARTIAL. Used the `body` slot wrapper correctly (`ProductCard` with on tap on the layout and body inside). Misused `find` with a dict literal `{product_id: product.id}` as the target — would never match because the literal is a new identity.
- **Pattern:** Claude leans toward more structured/decomposed solutions. In v0.4 Notes that meant honest acknowledgment of limitations. In v0.5 Notes it meant a clean canonical implementation. In v0.5 Shopping it meant the most natural reach for "find by key" which surfaced the spec ambiguity.

### Gemini 3.1 Pro

- **Notes:** Clean PASS. **Abandoned the v0.4 single-screen workaround** in favour of the canonical `shared:` + multi-screen approach. When both options are available, models prefer the canonical one.
- **Shopping:** **Cleanest output of the entire v0.5 test round.** Used three shared variables (`cart`, `unique_items`, `cart_total`), the `body` slot in a no-arg `CardWrapper()` wrapper, `length` for the badge, `count` for quantity tracking, `is in` / `is not in` for membership, `without` for removal. **The `count`-for-quantity insight is the right v0.5 idiom.** Sidesteps the find-by-key problem entirely.
- **Pattern:** Gemini in v0.5 is genuinely the most idiom-discovering of the three models. It finds clean paths through existing primitives without inventing or misusing.

### ChatGPT (free)

- **Notes:** Clean PASS. Used `shared:` with type annotation. **Major shift from v0.4** where ChatGPT invented cross-screen function visibility. The v0.5 documentation captured ChatGPT's invention preference and channelled it into the right pattern.
- **Shopping:** PARTIAL. Same `find` misuse as Claude. Plus `spread: space-between` (token form, ambiguous in spec). Plus didn't reach for the `body` slot wrapper despite the explicit prompt instruction. Plus borderline no-arg component invocation form.
- **Pattern:** ChatGPT consistently picks the most JS-idiomatic approach and is the most likely to surface "this term in the prompt didn't map to the right feature" gaps. Useful for finding where the spec's terminology connects (or doesn't) with developer expectations.

## Cross-test progress (v0.3.2 → v0.4 → v0.5)

| Test | Spec | Models | Verdict | Inventions |
|---|---|---|---|---|
| Calculator | v0.3.2 | 3 | FAIL → fed v0.4 backlog | Universal: arithmetic, equality |
| Todo | v0.3.2 | 3 | FAIL → fed v0.4 backlog | Universal: list `+`, removal; per-model: `without`, `each` in functions, etc. |
| Weather | v0.3.2 | 3 | PARTIAL → fed v0.4 backlog | `null`, number+string `+` |
| Chat | v0.4 | 3 | **PASS** | None |
| Music Player | v0.4 | 3 | **PARTIAL** | Claude only: icon-in-button compound |
| Notes (v0.4) | v0.4 | 3 | **MIXED** | Claude PASS-incomplete, Gemini PASS via workaround, ChatGPT cross-screen function calls |
| **Notes (v0.5 re-run)** | **v0.5** | **3** | **PASS** | **None** |
| **Shopping** | **v0.5** | **3** | **PARTIAL** | Claude + ChatGPT: `find` misuse; ChatGPT: `spread:` ambiguity, no-arg component |

**24 independent data points across 8 test runs (6 apps + 1 re-run + 1 new) × 3 models.** The v0.5 round added 6 data points (Notes re-run + Shopping). v0.5 acceptance is complete.

## Conclusions

### v0.5 ships as the stable release

v0.5 is shippable. The Notes re-run is the strongest validation result in the suite history (the entire v0.4 MIXED verdict transformed into a clean PASS). The Shopping PARTIAL findings are addressable with a small documentation patch, not a language change.

### Recommended v0.5.1 docs patch (5 one-liners)

1. `find` is identity-based, not structural — explicit warning with counter-example
2. `spread: true` is the canonical form — disambiguate the layout properties list
3. "Wrapper component" terminology cross-reference to the `body` keyword
4. Document Gemini's `count`-for-quantity pattern as the canonical "items with counts" idiom
5. No-arg component invocation form clarification

All documentation, no new features. Should be drafted and shipped before the transpiler workstream begins so the spec the transpiler is built against is unambiguous.

### v0.6 backlog (still deferred)

- Optimistic updates with rollback (depends on background requests + post-navigation error surfacing)
- Forms and validation
- Animations and transitions
- List search/filter/sort built into iteration syntax
- Routing patterns (deep links, query params, modal stacks)
- Mobile-specific patterns
- Theming and dark mode propagation
- Package/module system
- Doc-comment syntax
- Scroll behaviour
- Named slots (multiple body regions per wrapper)
- Lambda syntax for richer list operations
- Submit modifier on inputs

### What's next after v0.5.1

The next major workstream is the **TypeScript-to-Dart transpiler** against v0.5 (or v0.5.1 if the docs patch ships first). The design phase is over. The next version of Igni will be a working tool, not a markdown spec.

## Methodology notes

- Spec version tested: `spec/v0.5.md`
- Prompts source: `tests/v0.5/prompts.md`
- Each model tested in a fresh chat conversation: no system prompt, no prior context, no custom instructions enabled
- Outputs captured into `tests/v0.5/<App>.md` per the test methodology in `tests/README.md`
- **Verdict criteria:** PASS = zero inventions across all models; PARTIAL = at least one model invents but inventions are minor or v0.5.1-deferrable; MIXED = different models take fundamentally different approaches with different verdicts; FAIL = multiple models invent things v0.5 should have covered

## Pointers

- Per-test result files: `tests/v0.5/Notes.md`, `Shopping.md`
- Prompts used: `tests/v0.5/prompts.md`
- Spec snapshot tested: `spec/v0.5.md`
- v0.4 acceptance summary: `tests/v0.4/summary.md`
- v0.3.2 backlog (the source of v0.4): `tests/v0.3.2/summary.md`
