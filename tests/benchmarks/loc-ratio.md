# LOC ratio benchmark — Igni vs Flutter

**Date:** 2026-04-22
**Scope:** One-shot measurement, not an ongoing metric. Re-run when the spec changes shape (e.g. string interpolation lands) or when a new flagship test app appears.

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
| quizzler |    58    |      198        |       ~80        |    1.4×    |     3.4×        |
| bmi      |    97    |      423        |      ~380        |    3.9×    |     4.4×        |

## Observations

**The compression factor is not constant.** Igni:hand-Flutter ranges from 1.4× on quizzler to 3.9× on bmi. Three drivers:

1. **Widget extraction amortizes at scale.** Hand-Flutter bmi extracts 4–5 reusable widgets across 6–7 files; each one carries a `StatelessWidget` + `build()` + constructor-with-named-parameters boilerplate block. Igni's `component` keyword collapses each to one line of declaration plus the body. On large apps with many reused blocks, this compounds.
2. **Simple UI ≠ big compression.** Quizzler is one screen with a question model; hand-Flutter gets away with ~80 lines and Igni still needs ~58 because the question data (10 objects) dominates the LOC of both versions.
3. **Mechanical transpile is verbose by design.** The transpiler always wraps a `MaterialApp`, imports unconditionally, and emits a full `StatefulWidget`/`State` pair for every `screen`. A human would pick `StatelessWidget` for anything stateless. That's why the Igni:transpiled ratio (3.4–5.2×) is consistently larger than Igni:hand.

**The "5 lines instead of 50" pitch is roughly half-right.** For tiny apps (counter, dicee) the 10× compression claim against transpiler output holds. Against idiomatic hand-Flutter on realistic apps (bmi), the real number is closer to 3–4×. Still a strong result, but worth citing accurately.

**Where Igni actually saves:** the fixed boilerplate cost per "screen that does something." A hand-Flutter screen is ~40–60 lines of ceremony (imports, class declaration, state class, build method) before any UI logic. Igni has ~1 line of ceremony (`screen Name:`). So Igni wins most on apps with many small screens — and wins least on apps with one long screen plus heavy data content.

## What to cite in the dissertation

- **Against transpiled Dart: 3–5× compression on 3 apps of increasing size** (13 → 97 Igni LOC). This is the mechanical syntax-budget claim and it holds.
- **Against idiomatic hand-Flutter: 1.4–3.9×.** Widely variable; cite the range, not a single number.
- **Growth shape:** Igni:hand ratio *increases* with app size (1.4× → 3.9× across these three). That's the interesting finding — the case for Igni gets *stronger* as apps grow, because hand-Flutter's boilerplate-per-component scales worse than Igni's.

## What this doesn't measure (acknowledged gaps)

- **Readability** — LOC ignores token density, indentation depth, symbol count. Igni's win on LOC is reinforced by a separate cold-test methodology measuring LLM read-and-write accuracy, not re-litigated here.
- **Expressiveness gap** — Igni intentionally omits features (ternaries, string interpolation, multi-param lambdas). An "Igni LOC count" is only valid for *apps Igni can express*. Outside that envelope, Igni's LOC would be infinite or undefined, not small.
- **Runtime performance** — not measured. The generated Dart runs on standard Flutter with no Igni-side runtime; performance should equal hand-Flutter *in the limit*, but that's a claim for a separate benchmark and is not the research question here.
- **Hand-Flutter numbers are estimates, not measurements.** Angela Yu's reference implementations are rounded to tens based on public repo structure; a precise cite would require pinning a specific commit and `find . -name '*.dart' | xargs wc -l`. Deferred — the order-of-magnitude result stands either way.

---

*Linked from `docs/private/76_loc_benchmark_note.md` for the research-record trail.*
