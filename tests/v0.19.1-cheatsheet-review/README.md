# v0.19.1 cheatsheet review — chat-mode panel synthesis

**Date:** 2026-04-28. **Methodology:** per-minor-version chat-mode cheatsheet review (third precedent: v0.14.1, v0.15.0, v0.17.0). Tyr ran 4 web-UI LLMs async, copy-pasted `spec/v0.19.0-cheatsheet.md` (934 lines) into each, asked the three-question template (Q1 strongest / Q2 weakest+prune / Q3 semantic uncertainty). $0 cost; ~30 min wallclock.

## Methodology note

Chat-mode review reads the *whole document independently*. Distinct from Stage 2/3 panels which probe specific design changes. Per the v0.14.1 README's framing: "chat-mode review surfaces what panel-runs don't." For v0.19, three panel runs already validated the new surface (Stage 2 + Stage 0 + Stage 3, all 3-4/4 strong-pass); this read measures the post-implementation cheatsheet's clarity for someone reading top-to-bottom without prompt-specific framing. The v0.19.0 cheatsheet has accumulated three patches mid-cycle (`value_of()` widening, label-only spring consumption, quoted ISO timestamps); no full re-read since.

Chat-mode artifacts: the four raw outputs have minor text-mangling artifacts from web UI copy-paste (`screenslator`, `Semanrtainty`, `bind: draft,ge: shared.title`, `the sfrom the top`). Preserved as-is in the cell files for traceability.

## Panel

| Model | File | Notes |
|---|---|---|
| Gemini 3 Flash | `gemini-3-flash.md` | Tightest output. Headline framing: "90% Reference, 10% Tutorial — prune the 10%." |
| GPT 5.3 | `gpt-5.3.md` | Most structural critique. Names "init vs render-time semantic blur" as biggest future teaching risk. Writes terse single-line paragraphs. |
| Gemini 3.1 Pro | `gemini-3.1-pro.md` | Most concrete drift findings (object mutation buried, `without`/`replace` reference-equality trap). |
| Claude Opus 4.7 | `claude-opus-4-7.md` | Most teaching-gap raises (9 in Q3); names `every`-on-revisit as highest-stakes gap. |

## Convergence tables

### Q1 — What's strongest? (Protect, don't touch)

| Finding | Gemini Flash | GPT | Gemini Pro | Opus | Convergence |
|---|---|---|---|---|---|
| **"Reacting to users" / derived-state callout (`total = count * price` vs `total():`)** | ✓ "Rosetta Stone" | ✓ "the spine of the language" | ✓ "bedrock of mental model" | ✓ "load-bearing teaching moment" | **4/4** |
| Animation section (close second) | — | — | — | ✓ "two primitives, one rule each" | 1/4 |
| `❌ wrong / ✅ right` callout style | — | — | ✓ | — | 1/4 |

**4/4 unanimous.** The derived-state callout is the protect-at-all-costs section. **In the v0.19.1 prune, do not touch §Reacting to users.** Three cells specifically named the React/Vue/Svelte/Solid framing as the load-bearing pre-emptive teaching move; one (Opus) called the transitive-reach rule out as belonging there too. Gemini Flash's "Rosetta Stone" framing is the right tag for this section's role.

### Q2 — Weakest section + prune candidates

| Finding | Gemini Flash | GPT | Gemini Pro | Opus | Convergence |
|---|---|---|---|---|---|
| **`border:` Selected-state pattern (15-line tutorial) + Outlined-buttons example** | ✓ "tutorial snuck into a cheat sheet" | — | ✓ "13-line code block too heavy" | — | **2/4** |
| **Testing section overweight relative to language** | — | ✓ "spec gravity shifted" | — | — | 1/4 (load-bearing) |
| **Component events density (5 concepts crammed in)** | — | — | — | ✓ "past cheat-sheet stage" | 1/4 |
| **Lexical-reactivity rule restated 4–5 times** (Reacting, Functions, Components, Async re-fetch, every) | — | — | — | ✓ | 1/4 (specific) |
| **"What X doesn't do" enumerations leak roadmap** | — | — | — | ✓ | 1/4 |
| **Version-tagged callouts ("v0.20+ candidate", "Stream 3 candidate") leak internal planning** | — | — | — | ✓ | 1/4 |
| **`\` line-continuation pinned twice** (duplicate) | ✓ | — | — | — | 1/4 (trivial) |
| **`now()` non-reactivity caveat buried in Builtins junk-drawer** | — | — | — | ✓ "promote it or move it next to `every`" | 1/4 |
| **Figma `_`-flatten note under `theme:`** (niche, belongs in spec) | — | — | — | ✓ | 1/4 |
| **Merge `mock now:` and `freeze_time:`** (treat as one with optional block form) | — | ✓ | — | — | 1/4 (challenges the Q6 lock — see Decision below) |
| **Direct function testing via `render` is a structural exception** | — | ✓ "semantic leakage" | — | — | 1/4 (challenges a v0.18 lock) |
| **Snapshot section over-explains spring-target serialisation** | — | ✓ "implementation-detail-heavy" | — | — | 1/4 |

**2/4 strong on Border prune** — both Geminis flagged the same code block. Worth ~100-150 words combined when combined with the Outlined-buttons example.

**1/4 high-quality on Opus's structural critiques** (lexical-reactivity dedup, callout strips, version-tag removal). Each is small but cumulative; together they could shave 100-200 words while sharpening the doc.

**1/4 challenge to existing locks**: GPT proposes merging `mock now:` and `freeze_time:` (Q6 ambient-vs-block scoping was Tyr-locked at Stage 2; flipping is a re-design, not a prune). GPT proposes removing direct function testing via `render` (the v0.18 Q-G ratification; flipping is a design re-open). Both go to Tier C unless Tyr re-opens.

### Q3 — Genuine semantic uncertainty (teaching gaps)

| Finding | Gemini Flash | GPT | Gemini Pro | Opus | Convergence |
|---|---|---|---|---|---|
| **`every` block on screen revisit / resumption timing** ("does it fire immediately on remount or wait the duration?") | — | — | ✓ "29-second navigation away — fetch immediately or wait another 30s?" | ✓ "highest-stakes — stopwatches are an explicit example" | **2/4** |
| **Equality semantics — reference-vs-structural visibility** (`{a:1} is {a:1}` = false) | — | ✓ "needs more visibility, not buried" | (downstream — see next row) | ✓ "readers won't believe it until bitten" | **2/4** |
| **`without`/`replace` reference-equality trap** (downstream of equality semantics) | — | — | ✓ "`without(items, {id: 42})` will silently fail" | — | 1/4 (adjacent to equality 2/4) |
| **`spring()` is read-only animated mirror, not state** ("can I mutate spring output?") | — | ✓ "visually looks like assignment, semantically derived projection" | — | ✓ adjacent (`spring()` row identity in `each` reference-vs-structural conflict) | **2/4** (close — Opus's framing is row-keying-specific but the underlying gap is the same) |
| **Init-vs-render phase visual blur** (top-level runs once vs renders interleave visually) | — | ✓ "deepest teaching gap" | — | — | 1/4 (load-bearing methodology candidate) |
| **`bind:` + `on change:` execution order / batching** | ✓ | — | — | — | 1/4 |
| **`body` keyword single-widget vs list ambiguity** | ✓ | — | — | — | 1/4 |
| **`is` vs `contains` case-sensitivity asymmetry needs `why`** | ✓ | — | — | — | 1/4 (already pinned in v0.17.1; visibility could be louder) |
| **Functions reactive only when read (transitive)** | — | ✓ "people will assume functions subscribe — they don't" | — | — | 1/4 |
| **`round()` returns string is dangerous** | — | ✓ "language-design smell, candidate for redesign" | — | — | 1/4 (already pinned; smell critique is structural) |
| **`input` excluded from `shared.X`** | — | ✓ "conceptual crack in otherwise universal bind model" | — | — | 1/4 |
| **Object mutation via `{base with key: value}` is buried** ("can I do `user.age = 25`?") | — | — | ✓ | — | 1/4 |
| **`max_width:` + `fill: true` axis confusion** | — | — | ✓ | — | 1/4 |
| **`transition: fade` under `each` reordering** (silent no-op? unstated) | — | — | — | ✓ | 1/4 |
| **`mock fetch:` URL key matching** (exact string? path-only? query-aware?) | — | — | — | ✓ | 1/4 |
| **`value_of()` on unset binding** | — | — | — | ✓ | 1/4 |
| **Int vs decimal arithmetic silence** | — | — | — | ✓ | 1/4 |
| **"Variables read outside a block" — definition is inference-only** | — | — | — | ✓ | 1/4 |
| **Transitive-reach second clause** ("nothing reads = no-op for UI") | — | — | — | ✓ "concrete example would lock it in" | 1/4 |
| **`seen "string"` across element boundaries** | — | — | — | ✓ | 1/4 |

**2/4 cluster** on three teaching gaps: `every`-on-revisit, equality-semantics-visibility, `spring()`-is-not-state. Each is a real gap the cheatsheet doesn't currently pin.

**Highest-stakes 1/4** is GPT's init-vs-render phase visual blur — methodology-grade observation, candidate for a CLAUDE.md tracked-open-question or a v0.20+ design note rather than a v0.19.1 prune patch.

## Tiered action list

### Tier A — strong signal (3-4/4 convergence). v0.19.1 patch candidates.

**No 4/4 patches** (Q1 4/4 is *protect-don't-patch*).

**No 3/4 patches** in Q2 / Q3.

### Tier B — moderate signal (2/4 with concrete fix). v0.19.1 patch candidates.

1. **Prune `border:` Selected-state pattern + Outlined-buttons example** (Q2, 2/4 Gemini Flash + Gemini Pro). Both flagged the same 13–15-line code block. Compress to ~3 sentences + one syntax example. Saves ~100-150 words.
2. **Pin `every`-on-revisit semantics** (Q3, 2/4 Gemini Pro + Opus). Add a sentence to §Recurrence: *"On revisit, the `every` block resumes its previous cadence — the next tick fires when the duration elapses from the *previous* tick, not immediately on remount. Top-level captures (e.g. `start_time = now()`) don't re-fire on revisit; they ran once when the screen first opened."* ~40 words.
3. **Equality semantics visibility** (Q3, 2/4 GPT + Opus, with Gemini Pro on adjacent `without`/`replace` trap). Promote the existing reference-vs-structural rule to a bolded callout in §Boolean logic, add the `without(items, {id: 42})` worked-fail example. ~50 words added; visibility increase.
4. **`spring()` is a read-only animated mirror** (Q3, 2/4 GPT + Opus). One sentence in §Animation: *"`spring(value)` is a read-only animated projection of `value` — you can read the spring binding, but reassigning to it has no effect. To change the animated value, reassign the underlying state."* ~30 words.

**Net Tier B word delta:** approx -100 to -150 (border prune) + ~120 (clarification additions) = **-0 to -30 words**, before the rest of the prune target.

### Tier C — single-model raises with high specificity (apply if cheap; otherwise log)

5. **Lexical-reactivity rule restated 4–5 times** (Opus 1/4, specific). Pick one canonical statement (in §Reacting to users); replace the four downstream restatements with back-references ("see §Reacting to users on lexical reactivity"). Saves ~100-200 words; risk: under-specified consumers feel less pin-able. Recommend apply.
6. **Strip version-tagged callouts from cheatsheet** (Opus 1/4). "v0.20+ candidate", "Stream 3 candidate" leak internal planning. Remove or compress to "future versions may widen this." Saves ~30-50 words.
7. **Compress "What X doesn't do" enumerations** (Opus 1/4) in §Animation and §Testing to single-line "v0.19 ships X only." Saves ~50 words.
8. **Pick one `\` line-continuation pin** (Gemini Flash 1/4). Currently pinned twice; remove one. Saves ~10 words.
9. **Promote `now()` non-reactivity caveat from Builtins junk drawer** (Opus 1/4). Move next to §Recurrence (where `every` lives), or bold the existing line in §Builtins. ~5 words moved; visibility increase.
10. **Remove or compress Figma `_`-flatten note** under `theme:` (Opus 1/4). Niche; belongs in spec. Saves ~30 words.
11. **Object mutation `{base with key: value}` location** (Gemini Pro 1/4). Currently buried in §Lists "Updating one field on an item." Add a one-line cross-reference under §Variables ("see §Lists for object update syntax") or move to a §Objects sub-section. Open question: does Igni allow direct `user.age = 25`? Cheatsheet should answer this either way.
12. **`without`/`replace` reference-equality trap warning** (Gemini Pro 1/4 — adjacent to equality 2/4). Add a worked example in §Lists where `without(items, {id: 42})` silently fails; steer to `filter(items, item => item.id is not 42)`. ~40 words added.
13. **`max_width:` + `fill: true` axis-confusion clarification** (Gemini Pro 1/4). Add one sentence: *"`fill: true` siblings split space along the parent layout's main axis (height for vertical, width for horizontal)."* ~20 words.
14. **`transition: fade` under `each` reordering note** (Opus 1/4). Add one line: *"Reordering items inside an `each` is a no-op for `transition: fade` — fades fire on add/remove, not on order changes."* ~25 words.
15. **`mock fetch:` URL key matching clarification** (Opus 1/4). One line: *"Mock keys match the literal URL string. Templated URLs (`fetch("/api/users/" + id)`) match against the resolved string — `"/api/users/42"` not `"/api/users/:id"`."* ~30 words.
16. **`value_of()` on unset binding** (Opus 1/4). Add: *"On an input the user hasn't typed into yet, `value_of()` returns the bound variable's initial value."* ~20 words.
17. **Int vs decimal arithmetic** (Opus 1/4). Pin in §Variables: *"Numeric arithmetic mixes int and decimal freely; `/` returns a decimal (use `floor()` for integer division). Implicit string concatenation does NOT coerce — wrap with `+ ""` or use `+ <num>` against a known-string."* ~40 words. Open: depends on actual codegen behaviour.
18. **Transitive-reach concrete example** (Opus 1/4). One worked example showing reassign-without-read = no-op. ~20 words.
19. **`seen "string"` across element boundaries** (Opus 1/4). One line: *"`seen` matches strings within a single element's text content, not across adjacent labels."* ~20 words.
20. **`is`/`contains` asymmetry needs `why`** (Gemini Flash 1/4). Already pinned in v0.17.1; could add one-line rationale ("`is` is structural for primitives; `contains` is the textual-search escape hatch and is therefore case-insensitive"). ~25 words.
21. **`bind:` + `on change:` execution order** (Gemini Flash 1/4). One line clarifying batching. ~20 words.
22. **`body` keyword single-widget vs list** (Gemini Flash 1/4). One line: *"`body` renders the caller's indented content directly — multiple top-level children render as siblings, no implicit Column wrap."* ~25 words. Open: depends on actual codegen behaviour.
23. **Functions reactive only when read** (GPT 1/4). Already implicit but could be explicit: *"Defining a function doesn't subscribe to anything — only calling it from the rendering body wires up reactive reads."* ~25 words.

### Tier D — design-shape challenges (do NOT apply as v0.19.1 docs patch)

These propose flipping locked design decisions, not clarifying them:

- **Merge `mock now:` and `freeze_time:` into one form** (GPT 1/4). Q6 ambient-vs-block scoping was Tyr-locked at Stage 2; Stage 3 4-cell panel held it 4/4. Flipping requires a Stage 2 re-design, not a v0.19.1 docs change. Log to ROADMAP Stream 3 only if real-app friction surfaces.
- **Remove direct function testing via `render`** (GPT 1/4). The v0.18 Q-G "render-makes-function-reachable test-scope override" was Tyr-ratified post-Stage-0 in v0.18. Flipping needs a redesign cycle, not a v0.19.1 docs change.
- **Redesign `round()` to return numeric** (GPT 1/4). Existing v0.17.1 cheatsheet pin documents the footgun; redesign is a v0.20+ candidate, not a v0.19.1 patch.
- **Make init-vs-render phases visually distinct** (GPT 1/4). Proposes new `state:` block-syntax. Methodology-grade observation; CLAUDE.md tracked-open-question or v0.20+ design-note candidate. Not a v0.19.1 docs change.

### Tier E — methodology candidates for CLAUDE.md / future design notes

These are observations about the *language design*, not the cheatsheet's clarity:

- GPT's "init vs render-time semantic blur" — flag as a tracked open question for v0.20+.
- Opus's `every` example correctness depends on the resumption-timing answer — codegen verification candidate (does the existing `every` actually behave as the cheatsheet describes on revisit?).

## Decisions for Tyr

Recommendation summarised:

1. **Apply all 4 Tier B patches** in v0.19.1 (border prune, every-on-revisit, equality visibility, spring read-only). Cumulative net: roughly word-neutral (prune cancels clarification additions).
2. **Apply Tier C items 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 18, 19** (the cheap, low-risk clarifications + structural prunes). Skip 11 (object mutation) until you decide if `user.age = 25` works — open behavioural question. Skip 17 (int/decimal arithmetic) and 22 (`body` semantics) until codegen-verified — these require empirical confirmation, not just docs pin.
3. **Tier D: log only.** Don't flip Q6 (`mock now:` / `freeze_time:`) or v0.18 Q-G (function testing via `render`) in a docs iteration. If you want to revisit those, that's a separate v0.20+ design cycle.
4. **Tier E: log to CLAUDE.md tracked-open-questions** (the init-vs-render phase visual-blur candidate). Folds neatly into the v0.19.1 CLAUDE.md cleanup step that's already in the plan.

**Total expected v0.19.1 cheatsheet word delta:** prune Tier B border + Tier C items 5/6/7/8/10 saves ~250-350 words; Tier B + Tier C clarifications (additions) cost ~150-250 words. Net **~-50 to -150 words**. To hit Tyr's 400-500 word prune target, would need additional cuts — most natural source is GPT's "Testing overweight" critique applied as a focused trim of the snapshot subsection's spring-target serialisation explanation (~50-100 words) + Component events density compression (Opus 1/4, ~50-100 words).

## Cumulative cost

$0 — all four cells ran on Tyr's existing web-UI subscriptions. ~30 min wallclock.

For comparison:
- v0.14.1 cheatsheet review (4 cells, same template): $0
- v0.15.0 meta-review (3 cells + later 4 added): $0
- v0.17.0 meta-review (7 cells across cheatsheet + spec passes): $0

Chat-mode review remains the highest-signal-per-dollar instrument in the cycle.
