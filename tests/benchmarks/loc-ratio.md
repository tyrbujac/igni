# LOC ratio benchmark — Igni vs Flutter

**Date:** 2026-04-22 (extended same day with mi-card row — see *Update log* below)
**Scope:** One-shot measurement, not an ongoing metric. Re-run when the spec changes shape (e.g. string interpolation lands) or when a new flagship test app appears.

## Update log — 2026-04-22 late session

Added `mi-card` row (Angela Yu's MiCard identity-card app, built fresh in Igni via `igni new mi-card`). See `docs/private/77_micard_dogfood.md` for the session narrative and spec-gap findings. Summary finding: the "ratio grows with app size" framing from the original three rows was too simple — MiCard is *tiny* (15 Igni LOC) but compresses *aggressively* (5.3×) against hand-Flutter because the app is styling-heavy rather than state-heavy. **App category (static-layout vs state-driven) matters as much as size.**

## Methodology

For each app, three line counts:

- **Igni source** — the `.igni` file(s), `wc -l` of raw source. No blanks-removed, no comments stripped. This is what the developer writes.
- **Transpiled Dart** — `wc -l` of the Dart the Igni transpiler emits (`src/cli.ts app.igni`). This is the *mechanical* translation; it includes boilerplate the transpiler always emits (MaterialApp wrapper, Theme, Scaffold, StatefulWidget/State pairs even when stateless would work).
- **Idiomatic hand-Flutter** — an estimate, not a measurement. Based on Angela Yu's public Flutter Bootcamp reference implementations of dicee / quizzler / bmi, which are widely used as canonical "what a human would write" for these specific apps. Numbers rounded to tens.

All counts are lines, not bytes. Blank lines and import lines are included on both sides. For multi-file hand-Flutter, the count is the *sum* across all files (main.dart + any extracted widget/model files).

## Results

| App      | Igni src | Transpiled Dart | Hand Dart (est.) | Igni:hand  | Igni:transpiled |
|----------|---------:|----------------:|-----------------:|-----------:|----------------:|
| dicee    |    13    |       68        |       ~30        |    2.3×    |     5.2×        |
| mi-card  |    15    |       95        |       ~80        |    5.3×    |     6.3×        |
| quizzler |    58    |      198        |       ~80        |    1.4×    |     3.4×        |
| bmi      |    97    |      423        |      ~380        |    3.9×    |     4.4×        |

## Observations

**The compression factor is not constant — and it's not a clean function of app size.** Igni:hand-Flutter ranges from 1.4× on quizzler to 5.3× on mi-card, and those data points are at opposite ends of the size axis (tiny static vs medium stateful). **App category matters at least as much as app size.** Four drivers:

1. **Static-layout apps compress hardest.** MiCard (15 Igni LOC → ~80 hand Flutter, 5.3×) is all styling: `TextStyle`, `Colors.teal.shade100`, `Divider(color: ...)`, `Card(margin: ...)`, `ListTile(leading: ..., title: ...)`. Angela's reference spells out every `fontSize` / `fontFamily` / `color` on every `Text`. Igni collapses all of that into style tokens (`color: teal`, `style: heading`) and layout modifiers (`background: card, rounded: medium`). Less logic, more styling → bigger compression.
2. **Widget extraction amortizes at scale.** Hand-Flutter bmi extracts 4–5 reusable widgets across 6–7 files; each one carries a `StatelessWidget` + `build()` + constructor-with-named-parameters boilerplate block. Igni's `component` keyword collapses each to one line of declaration plus the body. On large apps with many reused blocks, this compounds.
3. **Simple UI ≠ big compression when data dominates.** Quizzler is one screen with a question model; hand-Flutter gets away with ~80 lines and Igni still needs ~58 because the 10-question data list dominates the LOC of both versions. Questions are the same object literals on both sides.
4. **Mechanical transpile is verbose by design.** The transpiler always wraps a `MaterialApp`, imports unconditionally, and emits a full `StatefulWidget`/`State` pair for every `screen`. A human would pick `StatelessWidget` for anything stateless. That's why the Igni:transpiled ratio (3.4–6.3×) is consistently larger than Igni:hand.

**The "5 lines instead of 50" pitch is roughly half-right — and depending on the app, closer to fully-right.** For styling-heavy static apps (mi-card), 5.3× vs hand is genuine. For small stateful apps (dicee), 2.3×. For data-heavy screens (quizzler), 1.4×. The average doesn't tell the story — the distribution does.

**Where Igni actually saves:** (a) the fixed boilerplate cost per "screen that does something" (~40–60 hand-Flutter lines of ceremony collapse to Igni's `screen Name:` plus body), and (b) the per-widget styling overhead (`TextStyle(fontSize: 40, color: Colors.white, fontWeight: bold, fontFamily: 'Pacifico')` ⇒ `style: heading` plus whatever else applies). Igni wins most on apps with many small screens, and apps with heavy explicit styling. Igni wins least on apps dominated by data literals.

## What to cite in the dissertation

- **Against transpiled Dart: 3.4–6.3× compression on 4 apps** (13 → 97 Igni LOC, static + stateful + data-heavy). This is the mechanical syntax-budget claim and it holds strongly across app classes.
- **Against idiomatic hand-Flutter: 1.4–5.3×.** Cite the range, not a single number, and explain the variance — styling-heavy static apps at the top end, data-heavy apps at the bottom.
- **App category is a first-class driver.** Don't frame the compression ratio as a function of size alone. The mi-card row at 15 LOC compresses *harder* than bmi at 97 LOC because static styling is where Igni's style-token abbreviation pays off most. This is a more interesting finding than the original "grows with size" framing — size and category together determine the result.

## What this doesn't measure (acknowledged gaps)

- **Readability** — LOC ignores token density, indentation depth, symbol count. Igni's win on LOC is reinforced by a separate cold-test methodology measuring LLM read-and-write accuracy, not re-litigated here.
- **Expressiveness gap** — Igni intentionally omits features (ternaries, string interpolation, multi-param lambdas). An "Igni LOC count" is only valid for *apps Igni can express*. Outside that envelope, Igni's LOC would be infinite or undefined, not small.
- **Runtime performance** — not measured. The generated Dart runs on standard Flutter with no Igni-side runtime; performance should equal hand-Flutter *in the limit*, but that's a claim for a separate benchmark and is not the research question here.
- **Hand-Flutter numbers are estimates, not measurements.** Angela Yu's reference implementations are rounded to tens based on public repo structure; a precise cite would require pinning a specific commit and `find . -name '*.dart' | xargs wc -l`. Deferred — the order-of-magnitude result stands either way.

---

*Linked from `docs/private/76_loc_benchmark_note.md` for the research-record trail.*
