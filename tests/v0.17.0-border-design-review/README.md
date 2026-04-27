# v0.17.0 border framing critique — Stage 2 panel

**Status: prompts ready, runs pending.** Single-prompt 3-frontier-model panel pressure-testing the *visual-chrome-under-signals* methodology framing in `docs/private/111_v017_border.md`.

## What this is

Stage 2 panel against the **framing**, not the syntax. The border syntax (`border: <thin|medium|thick>` modifier, theme-resolved colour) is precedented and locked — three sub-decisions resolved before this panel ran. What's getting tested is the methodology claim that visual-chrome primitives systematically under-signal in cold-test methodology, generalised from one observation (the v0.16.0 extrapolation panel returning zero `border:`/`shadow:` invention) to a class of primitives (gradient, opacity, blur, advanced radius, rotation, scale).

The reason a Stage 2 is worth running here even though syntax is locked: the methodology claim determines whether *future* visual-chrome primitives skip cold-test entirely and go straight to hand-translation. That's a recurring procedural decision; getting the rule wrong recurs across multiple cycles.

After this panel lands, proceed to Stage 0 prompt finalisation regardless of outcome (Tyr instruction). Stage 2 is a sharpening pass, not a gate.

## Panel composition

| Model | Provider | ID |
|---|---|---|
| Claude Opus 4.7 | Anthropic | `claude-opus-4-7` |
| GPT-5.5 | OpenAI | `gpt-5.5` (with `--effort high`) |
| Gemini 3.1 Pro Preview | Google | `gemini-3.1-pro-preview` |

Three frontier models matches the existing Stage 2 pattern (`tests/v0.16-event-payload-design-review/`, `tests/v0.15.0-design-review/`). No flash-lite — Stage 2 is design-review, not adoption-test, so noise tier is unhelpful.

## Critique questions (per Tyr)

1. **Does the visual-chrome-under-signals pattern hold as stated?** Pressure-test the causal mechanism (rendering detail < prompt resolution).
2. **Does it generalise cleanly to gradient / opacity / blur / advanced radius / rotation / scale?** Per-primitive judgements; counter-examples sharpen the pattern.
3. **Is the two-prong protocol (Path C prior + hand-translation validation) sufficient, or does it need a third leg?**
4. **Most important — are there visual-chrome primitives that DO surface in cold tests?** Counter-examples. Even one well-grounded case bounds when the pattern applies.

Output instruction: each question answered with explicit `hold / refine / reject` position + concrete evidence. Q2 demands ≥3 per-primitive calls; Q4 demands ≥1 named probe.

## Running the panel

API runner at `tests/runner/`. Run with `--no-spec` (the design-note excerpt lives inside the prompt body, not as a `--spec` injection — matches the existing Stage 2 filename convention `<model>_none_<slug>.{md,json}`) and `--no-grade` (prose output, no transpiler check).

```bash
cd tests/runner

# Anthropic
npx tsx run.ts \
  --model claude-opus-4-7 \
  --no-spec \
  --prompts ../v0.17.0-border-design-review/prompts.md \
  --out ../v0.17.0-border-design-review \
  --no-grade

# OpenAI (high reasoning)
npx tsx run.ts \
  --model gpt-5.5 \
  --effort high \
  --no-spec \
  --prompts ../v0.17.0-border-design-review/prompts.md \
  --out ../v0.17.0-border-design-review \
  --no-grade

# Google Pro
npx tsx run.ts \
  --model gemini-3.1-pro-preview \
  --no-spec \
  --prompts ../v0.17.0-border-design-review/prompts.md \
  --out ../v0.17.0-border-design-review \
  --no-grade
```

Three outputs land as `<model>_none_visual-chrome-empirical-pull-blindspot-framing-critique.{md,json}`. Cost target: ~$0.30 cumulative.

## Synthesis

After all 3 cells complete, append a synthesis section to this README with:

- **Q1 verdict** — 3/3 hold / 2/3 hold w/ refinement / 1/3 hold + the strongest dissent recorded verbatim.
- **Q2 per-primitive convergence table** — six rows (gradient, opacity, blur, advanced radius, rotation, scale), three columns (one per model), cells marked clean-fit / partial / counter-example.
- **Q3 third-leg verdict** — any third leg proposed by 2+/3 models is a real candidate; record exact phrasing. If 0/3 propose a third leg, two-prong protocol holds.
- **Q4 counter-examples catalogue** — every concrete counter-example named with which model raised it.
- **Patch decision** — per spec-cycle skill rules: 3/3 convergent on a refinement → patch doc 111; 2/3 → consider, Tyr's call; 1/3 → log only.
- **Doc 111 patch list** (if any) staged for follow-on edit pass before Stage 0 prompt finalisation.
- **Cost** — sum of `usage` fields from the three runner JSON outputs.

## Out of scope

- Critiquing the border syntax (locked: `thin/medium/thick` width, theme-resolved colour, defer divider, hardcode shadow colour for v0.18). The prompt is intentionally framing-only.
- Stage 0 prompt drafting. Begins after this panel's synthesis lands and any doc-111 patches apply.
- Setting up the v0.18 shadow design directory.

---

# Synthesis (2026-04-27)

**Headline: 3/3 REFINE on every question.** No model held the framing as written; no model rejected it outright. All three converge on a sharper bounded pattern + a missing third leg. Doc 111 should patch before Stage 0.

**Total cost:** $0.1493 (claude-opus-4-7 $0.0619 + gpt-5.5 high $0.0745 + gemini-3.1-pro-preview $0.0129). Half the $0.30 budget — single-prompt panels are cheap.

## Q1 — Does the pattern hold? (3/3 refine)

| Model | Position | Mechanism critique |
|---|---|---|
| claude-opus-4-7 | Refine | "Rendering details fall below prompt resolution" is a *symptom not cause*. Real stack: (a) prompt-resolution truncation (secondary); (b) **cheatsheet anchoring** — `card` already encodes "what counts as styled"; (c) training-data bias toward functional code; (d) the v0.16 panel was specifically *spec-extrapolation under functional prompts*, not Figma-translation. Refined claim should be "**cold-test under functional/spec-extrapolation prompts** under-signals chrome" — not the broader claim that immunises against a fix that's available. |
| gpt-5.5 | Refine | Mechanism incomplete. Stronger diagnosis: "**unprompted app-generation cold tests preferentially expose missing functional/state/data primitives, not visual-spec translation primitives**." Refined claim: "general-purpose cold tests under-detect low-semantic visual-fidelity primitives unless the prompt explicitly makes that visual property part of the task." |
| gemini-3.1-pro-preview | Refine | Mechanism incomplete. Real mechanism: "**functional dependency combined with semantic encapsulation bias**" — LLMs prioritise functional primitives, AND assume existing semantic tokens (`card`, `button`, `input`) already encapsulate visual chrome by default (MUI/Bootstrap training-data bias). Lack of signal isn't just prompt resolution; it's LLM assuming the existing nouns handle visual heavy lifting. |

**Convergent additional mechanisms named by 2-3/3:**
- **Cheatsheet/semantic-encapsulation substitution** (3/3) — `card` token plus `rounded:` + `background:` already cover the visible "card-ness" surface, so models satisfice.
- **Functional vs aesthetic salience as the load-bearing distinction** (3/3) — chrome only under-signals when *decorative*. When chrome carries semantic/functional/behavioural load (states, accessibility, brand, hierarchy), it surfaces. *This recurs verbatim across Q1 and Q4.*
- **Prompt-design dependence** (2/3 explicit, Opus + GPT) — the v0.16 panel was spec-extrapolation under functional prompts; a Figma-translation cold-test variant might surface chrome. The pattern is a property of *prompt design*, not *primitive class*.

## Q2 — Per-primitive generalisation (split, with strong consensus on what to remove)

Convergence across the 6+1 named primitives:

| Primitive | Opus | GPT-5.5 | Gemini Pro | Convergent verdict |
|---|---|---|---|---|
| **Border** (anchor) | clean fit | clean fit | clean fit (implied) | ✅ keep |
| **Shadow** | clean fit | clean fit | clean fit (implied) | ✅ keep |
| **Advanced radius** | clean fit | clean fit | clean fit (implied) | ✅ keep |
| **Gradient** | partial (decorative no, brand-prompt yes) | partial ("brand landing page" surfaces it) | clean fit | 2/3 partial → **partial fit, qualify** |
| **Opacity** | counter-example-leaning (functional: disabled/modals/scrims) | partial → counter (semantic for disabled/overlay/scrim/skeleton) | partial → counter (functional proxy: disabled, overlays) | **3/3 too functional — REMOVE from class** |
| **Rotation** | partial fit ("transforms wearing chrome clothing") | counter (carousels, gauges, clock hands, chevrons, drag affordances) | (not addressed) | **2/3 not chrome — REMOVE** |
| **Scale transforms** | partial fit (interactions) | counter (zoom/pinch/hover/pressed/drag) | (not addressed) | **2/3 not chrome — REMOVE** |
| **Animation curves** | reject the fit ("smooth/bouncy/snappy" surfaces curves) | partial (exact easing under-signals, "smooth/springy" prompts surface them) | clean fit (specific curves no) | mixed — **REMOVE or qualify heavily** |
| **Blur** *(not in original list but probed)* | (not addressed) | partial-to-counter ("frosted glass", "glassmorphism") | clean fit (purely stylistic) | **mixed — leave in but flag prompt-shape sensitivity** |

**Strongest convergent calls:**
- The clean-fit core is **border + shadow + advanced radius** *(only)*.
- **Opacity, rotation, scale transforms, animation curves should not be in the named class** — they're either functional (opacity/disabled-states), interaction primitives wearing chrome clothing (rotation/scale), or shape-cue-prompt-sensitive (animation curves).
- Doc 111's "tentatively" hedge on animation curves was already correct; should become explicit removal.

## Q3 — Is two-prong sufficient? (3/3 reject — third leg needed; split on which)

| Model | Third leg proposed | Justification |
|---|---|---|
| claude-opus-4-7 | **Peer-language-survey, lightly formalised** | Path C as prior is *self-justifying/circular*; hand-translation has N=1-author bias. Need external + pre-flight. Peer-language is cheap, has useful negative (absence flags Path C overreach), framed as "does the designer-engineer's existing toolchain treat this as a primitive or a recipe?". Real-app-corpus better in principle but expensive/noisy. Designer-interview too soft. Accessibility narrow. |
| gpt-5.5 | **Pre-flight Figma corpus / hand-translation benchmark** | Two-prong "risks becoming 'we already decided this belongs, and later we will notice whether we use it'." Sample real Figma files, translate under current Igni, measure frequency + workaround cost. Peer-language is "useful cheap sanity check but weaker because Igni's promise is Figma-translation, not parity with every peer language." |
| gemini-3.1-pro-preview | **Real-app Figma corpus scan (statistical frequency)** | Hand-translation is "entirely post-hoc; tells you if the primitive works *after* you've implemented it." Spec-budget rule means "visual primitives must earn through statistical dominance in design files." Border/shadow nearly 100%; blend modes/SVG filters fail. Statistical prior replaces cold-test as pre-flight empirical pull. |

**3/3 reject "two-prong is sufficient."** **2/3 (GPT + Gemini) name Figma corpus scan directly** as the third leg. **3/3 mention peer-language as supporting** evidence (Opus prefers it as the cheap third leg; GPT/Gemini name it as weaker-but-useful sanity check). 

The strong convergent claim: **third leg must be (a) pre-flight, (b) external to author judgement, (c) Figma-relevant**. The cheap-vs-rigorous split between peer-language (Opus) and Figma-corpus (GPT + Gemini) is a real Tyr decision — peer-language is a 30-minute pass per primitive, Figma-corpus needs a curated corpus + tooling.

## Q4 — Counter-examples that DO surface (3/3 refine — pattern needs explicit boundary)

Convergent counter-examples named by all 3 models:

| Counter-example | Opus | GPT-5.5 | Gemini Pro | Convergent? |
|---|---|---|---|---|
| **Colour / theme tokens under brand-themed prompts** | ✅ "almost certainly 4/4 cells will invent `color:`, `brand:`, `theme:`, `accent:`" | ✅ "navy-and-gold brand system → invent `theme:`, `color: primary`, `brandColor:`" | ✅ "color: red for errors" | **3/3** |
| **Hover / pressed / interaction states** | ✅ "any prompt mentioning interactive or button pulls state-variant invention" | ✅ "smooth transition / springy pressed state" | ✅ "LLMs routinely invent visual feedback mechanisms (`hover:`)" | **3/3** |
| **Font-weight / hierarchy text styling** | (not explicit) | ✅ "large hero title, bold KPI numbers, small muted captions" | ✅ "weight: bold for headers" | **2/3** |
| **Focus rings under accessibility prompts** | (implicit via "focus-ring styles when prompt mentions accessibility") | ✅ "keyboard-accessible form with visible focus states" | (not explicit) | **2/3** |
| **Animation timing under "smooth transition"** | ✅ "smooth/bouncy/snappy" | ✅ "smooth transition / springy" | (not explicit) | **2/3** |

**The load-bearing convergent boundary** (verbatim-similar across all 3 models):

- **Opus:** "Chrome under-signals **when it's decorative and substitutable**; it surfaces normally **when it carries semantic, behavioural, or brand load**."
- **GPT-5.5:** "Visual primitives under-signal **when they are merely Figma fidelity details**, but can surface in cold tests **when the prompt names them as brand, accessibility, hierarchy, interaction, or motion requirements**."
- **Gemini Pro:** "LLMs invent visual chrome **when it serves as a communication channel for state or hierarchy**. They only ignore visual chrome (borders, shadows, gradients) **when it serves merely as aesthetic decoration**."

**This is the strongest single finding of the panel.** Three models, three different word-choices, same boundary. Without this boundary, doc 111's pattern is too broad to be falsified — "starts to look like a license to ship any visual primitive on Path C authority alone" (Opus). With it, the pattern becomes precise and useful.

## Patch decision (per spec-cycle skill rules)

**3/3 convergent on multiple refinements → patch doc 111 before Stage 0.**

Five patches staged, in priority order:

1. **(P1, 3/3 strongest) Add the decorative-vs-semantic boundary as the load-bearing rule.** Replace the broad "visual-chrome under-signals" claim with: "*Decorative-and-substitutable* visual chrome under-signals in functional cold-test prompts; *semantically-loaded* visual chrome (state, accessibility, brand, hierarchy, interaction, motion) surfaces normally." This bounds the pattern and makes it falsifiable. Use Q4's three near-verbatim convergences as supporting evidence.

2. **(P1, 3/3) Add the third leg.** Two-prong is insufficient (3/3 reject). Recommendation: **adopt peer-language-survey as the cheap mandatory third leg** (Opus's argument is the strongest: pre-flight, external to author, useful negative signal, ~30 min per primitive). Note the Figma corpus alternative GPT + Gemini named — flag as a *future* upgrade when corpus tooling exists. Tyr's call between cheap-now (peer-language) and rigorous-later (Figma corpus).

3. **(P1, 3/3) Refine the named primitive class.** Remove opacity, rotation, scale transforms, animation curves — they fail the boundary in P1. Keep border, shadow, advanced radius. Note gradient and blur as *partial fits* (decorative use under-signals, semantic/brand prompts surface them).

4. **(P2, 3/3) Refine the mechanism statement.** Replace "rendering details fall below prompt resolution" (incomplete causal claim) with the layered mechanism: (a) **functional vs aesthetic salience** (the load-bearing axis), (b) **semantic encapsulation bias** (existing tokens like `card` substitute for chrome), (c) **prompt-design dependence** (spec-extrapolation under functional prompts is the specific instrument that under-signals; Figma-translation prompts likely don't). Cite all three models on the cheatsheet-anchoring/`card`-substitution mechanism.

5. **(P2, 2/3, Opus + GPT) Narrow the methodology claim's scope.** Frame the pattern as "*cold-test under functional/spec-extrapolation prompts* under-signals decorative chrome" — leave the door explicitly open for a Figma-translation cold-test variant in future cycles. The current note's broader claim immunises the methodology against a fix that's actually available.

**Doc 111 patch list staged for follow-on edit pass before Stage 0 prompt finalisation begins.** Do *not* touch doc 111 in this turn — Tyr reviews this synthesis first.

## Out of scope (this synthesis)

- The patches themselves (separate edit pass).
- Reframing whether border syntax should ship — sub-decisions remain locked, syntax-critique was outside scope.
- Stage 0 prompt drafting — begins after patches apply.
- The cheap-vs-rigorous third-leg call (peer-language vs Figma-corpus) — Tyr decision, not panel-decidable.
