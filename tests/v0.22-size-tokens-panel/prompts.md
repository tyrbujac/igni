# v0.22 size-token scale — single cold-blind question

**Format:** One question, anti-anchored to the **absence** of any current scheme. The cheatsheet excerpts in `injection-materials.md` are paste with all size-token names elided (`<token_A>` etc); the model proposes from scratch. Honest-no escape lets the model validate the canonical scheme as their independent choice rather than feeling forced to invent.

**Per-cell submission shape:** verbatim model response, with the operator-added per-cell header (see placeholder files for the exact frontmatter).

---

## Question — Design the size-token scale

**Setup.** Igni is a UI-first DSL whose source declares layouts and primitives without brackets or parentheses-on-invocation. Properties are written as `name: value` pairs after the primitive keyword. Igni's size-token scale is used **uniformly** by four properties: `gap:`, `padding:`, `rounded:`, and `size:`. One scale, four uses — whatever tokens you propose must read naturally in all four contexts.

The cheatsheet excerpt in the injection materials shows the **shape** of the current scale (number of named steps + numeric scale alongside) but with all token names elided as `<token_A>` / `<scale/N>`. Studio Properties panel mock shows segmented-control buttons with their labels stripped (`[ ? │ ? │ ? │ ? │ ? │ ? ]`).

**Your task.** Design the scale.

### (a) Propose

Two things, in order:

1. **Named steps.** How many word-token steps does the scale have? What does each represent (rough pixel value or relative proportion is fine)? What's each one called? List them.
2. **Numeric scale alongside?** Does the scale also have a numeric companion (e.g. `scale/N` or similar)? If yes, what's the form? Is it dense, sparse, or unconstrained?

While proposing, **explicitly consider** whether the scale needs:
- **A zero-value token** (so a designer can write `padding: <zero>` to flatten a layout's padding to 0). Currently this is unaddressed in the cheatsheet excerpt — neither the named steps nor the numeric scale includes a 0.
- **A max-value token for `rounded:`** (so a designer can express a pill-shaped button or a circular badge — fully-rounded corners based on the container's smaller dimension).
- **Extension tokens beyond a 3-step word scale** (e.g. an "extra-small" between zero and the smallest step, or an "extra-large" beyond the largest step). The cheatsheet excerpt shows 3 word steps; is that sufficient granularity for design work, or does it want widening?

For each of these three, decide **independently** whether it's a real gap that warrants a token. Don't feel pressured to add all three (or any) — argue from designer ergonomics + spec budget + "one way to do everything."

### (b) Justify

In 2-3 paragraphs. Cover:
- **Number of steps.** Why this many? What's the granularity argument?
- **Naming choices.** Why these names? Consider source readability (LLMs author Igni; humans read it) AND panel-label feel (the same token shows up as a button label in Igni Studio's Properties panel; it must read natively in a design tool, not just in source code).
- **Uniformity across properties.** Does any token name read awkwardly in one of the four uses (`gap:`, `padding:`, `rounded:`, `size:`)? If so, how do you handle it?
- **Special cases**, if you proposed any (zero, max-rounded, extension tokens). Why these specifically?

### (c) Honest-no escape

If after proposing your scale, you realise you'd revise toward `small / medium / large` + `spacing/1..8` (the canonical Igni scheme — disclosed only here, after your proposal), **say so explicitly**. The "I'd keep it as-is" answer is fully valid and a real possible verdict — the panel is structured so this verdict counts as a status-quo lock, not a failure to engage.

If your independent proposal differs from the canonical scheme, do **not** revise it after seeing the canonical. Hold your proposal; the panel records both your independent answer and your reaction to the canonical disclosure.

---

## Designer-lean frame (read before answering)

The canonical user of Igni is a Figma-background designer + LLM pair authoring `.igni` source from a Figma design. Lean toward what reads natively in a **design panel** (segmented controls, tooltips, colour pickers — Figma / Sketch / Adobe XD aesthetic) — not what reads natively as a **Tailwind class** (`sm` / `md` / `lg` are abbreviations native to utility-CSS, not to design tools).

Counter-frame the training distribution. Frontier models have seen `sm` / `md` / `lg` thousands of times in Tailwind code; that does **not** automatically make them right for a designer-leaning DSL. Treat the Tailwind defaults as one option among many, not the baseline.

---

## Submission shape

Each cell produces a single response with:
- **Proposed scale.** Numbered list of named steps (with rough pixel values or proportions) + numeric scale (if any).
- **Special-case decisions.** Per the three explicit considerations: zero / max-rounded / extension. Each: ADD or SKIP, with name (if ADD) and one-line reason.
- **Justification.** 2-3 paragraphs.
- **Honest-no reaction.** After seeing the canonical disclosure, what's your reaction? Hold / partial revise / full revise.
- **Confidence.** HIGH / MEDIUM / LOW (lets the synthesizer weight strong-cite-of-cheatsheet differently from soft-impression).
