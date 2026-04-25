# v0.14.1 cheatsheet review — synthesis

**Date:** 2026-04-26
**Methodology:** Web-LLM chat (not the runner). 4 frontier models reviewed `spec/v0.14.1-cheatsheet.md` end-to-end and answered three questions: Q1 strongest / Q2 weakest / Q3 semantic uncertainty.

## Methodology note

This is the first cheatsheet-review pass using web-LLM chat instead of the cold-test runner. Trade-offs:

- ✅ **Faster setup.** Single-message prompt copy-pasted into 4 chat interfaces (Claude.ai, ChatGPT, Gemini Pro, Gemini Flash). No `tests/runner/` config, no `.env`, no cost.
- ✅ **Useful for prose-only review.** Q1/Q2/Q3 questions don't need transpile auto-grading.
- ⚠ **Less reproducible than panel runs.** Chat history is volatile; responses must be saved manually (this directory). Different sessions will produce non-identical responses.
- ⚠ **Version drift across providers.** ChatGPT exposed GPT-5.3 in chat (vs GPT-5.5 via API in the runner panel). Worth noting in the dissertation methodology chapter as a caveat for chat-mode-vs-API-mode comparison.

For exploratory questions where convergence-across-models is the signal, web-LLM chat is sufficient. For ship-gate measurements (Stage 0, Stage 3), the runner remains canonical because reproducibility matters there.

## Panel

| Model | Source | Notes |
|---|---|---|
| `claude-opus-4-7` | Claude.ai chat | Frontier flagship, same model ID as runner panel. |
| `gpt-5.3` | ChatGPT | **Note version difference** — runner panel uses GPT-5.5; chat exposed 5.3. |
| `gemini-3.1-pro-preview` | Gemini chat | Frontier flagship, same as runner panel. |
| `gemini-3.1-flash-lite-preview` | Gemini chat | Documented panel-noise tier; included anyway since prose-critique sometimes surfaces unique simpler-frame raises. |

## Convergence tables

### Q1 — What's strongest?

| Finding | Models | Convergence |
|---|---|---|
| 17-line Todo intro (compact, every line load-bearing) | claude, gpt, gemini-pro, gemini-flash | **4/4 unanimous** |
| Lexical reactivity rule clarity ("re-evaluates from the top whenever any variable it references is reassigned") | claude, gpt, gemini-pro, gemini-flash | **4/4 unanimous** |
| "Why doesn't state reset?" callout (think "starts at", not "resets to") | claude, gpt, gemini-pro | 3/4 |
| Pomodonut wall-clock-vs-decrement teaching pattern | claude, gemini-flash | 2/4 |
| Layout / input primitive tables (visual density) | gemini-pro, gemini-flash | 2/4 |
| `bind:` rule "bound variable already updated when handler fires" | claude, gpt | 2/4 |
| Hard-constraint quotability ("Max nesting 4", "Cross-screen calls NOT allowed") | claude alone | 1/4 |
| `{x with key: value}` immutable-update teaching | gpt, gemini-flash | 2/4 |
| `every` + `now()` + missed-ticks rule | gpt, gemini-flash | 2/4 |
| `body` "renders exactly one widget" constraint | claude, gpt | 2/4 |

### Q2 — What's weakest?

| Finding | Models | Convergence | Action class |
|---|---|---|---|
| `input bind: shared.X` exception buried/dense | claude, gpt, gemini-flash | **3/4** | Tier A — pull into boxed rule |
| `on change:` programmatic-reassignment paragraph too heavy | claude, gemini-pro | 2/4 | Tier B — condense to one sentence |
| Lists section density (10 builtins dumped) | claude, gpt | 2/4 | Tier B — group queries / transforms / mutations |
| Layout / `fill:` / `max_width:` prose wordy | gemini-pro, gemini-flash | 2/4 | Tier B — bulleted "Sibling Interaction Rules" |
| Pomodonut/recurrence example doing too much | gemini-pro, gpt | 2/4 | Tier B — simplify to elapsed-seconds-only |
| "Reacting to users" overloaded (reactivity + operators + indexing + conditionals + boolean) | gpt alone | 1/4 | Tier C — note for restructure pass |
| "Getting input" over-explained scaffolding | gpt alone | 1/4 | Tier C — cut "read the table first..." prose |
| Styling section weakly structured (colours/spacing/typography mixed) | gpt alone | 1/4 | Tier C |
| Rules-section-at-end partly duplicate | gpt alone | 1/4 | Tier C |
| `{x with ...}` "verbose form is still legal" hedge | claude alone | 1/4 | Tier C — pick a winner |
| fetch-URL keystroke warning punts to spec | claude alone | 1/4 | Tier C — add broken/fixed example |
| Styling colours flat list (semantic vs literal not grouped) | claude alone | 1/4 | Tier C |
| "Sensible defaults...see the full spec" hand-wave | claude alone | 1/4 | Tier C |
| `is empty` / `is loading` ambiguity (keyword vs literal-state) | gemini-flash alone | 1/4 | Tier C — clarify special-form semantics |

### Q3 — Genuine semantic uncertainty

This is the highest-value question — it surfaces gaps in the runtime contract, not prose quality.

| Finding | Models | Convergence | Resolution path |
|---|---|---|---|
| `fetch()` reactivity / re-evaluation semantics | claude, gemini-pro, gpt | **3/4** | Tier A — pin in spec |
| Derived state / dependency tracking (`derived = base * 2`) | gemini-pro, gpt | 2/4 | Tier A — pin top-down evaluation order + dep graph rules |
| Function-call reactivity tracking (does `label total()` track `count`/`price` inside `total()`?) | claude, gpt | 2/4 | Tier A — pin |
| `emit` argument binding (positional? name match?) | claude, gemini-pro | 2/4 | Tier A — pin in §Component Events |
| `replace` / `without` multiplicity (first match? all?) | claude, gpt | 2/4 | Tier A — pin in §Lists |
| Equality semantics on objects (reference vs structural) | claude, gpt | 2/4 | Tier A — pin `is` semantics |
| Component re-evaluation (do components re-run on parent rerender?) | claude, gpt | 2/4 | Tier A — pin lifecycle |
| `each` re-evaluation behaviour (focus/scroll preservation) | gemini-flash alone | 1/4 | Tier B — implementation detail; pin if surfaces again |
| `body` empty / multi-child handling | gemini-flash alone | 1/4 | Tier B |
| Functions returning UI primitives | gemini-flash alone | 1/4 | Tier B — explicit "functions return data, components return UI" |
| Null-safe chaining (`items[0].text` on empty list) | gemini-flash alone | 1/4 | Tier B |
| Variable initialisation ordering (`count = total + 1; total = 5`) | gpt alone | 1/4 | Tier B |
| Event-handler batching semantics (`count = count + 1; count = count + 1`) | gpt alone | 1/4 | Tier B |
| Multiple variable reassignments in one function — render passes | gpt alone | 1/4 | Tier B |
| `on change:` feedback loops (`input bind: x, on change: x = upper(x)`) | gpt alone | 1/4 | Tier B — explicit loop-prevention rule |
| Navigation state persistence (does back-stack retain state?) | gpt alone | 1/4 | Tier B — pin |
| Async race semantics (`fetch("/a"); fetch("/b")` if /a resolves last) | gpt alone | 1/4 | Tier B — pin or document non-existence of guarantee |
| Max-nesting-depth counting algorithm (do nested layouts in conditionals count?) | gpt alone | 1/4 | Tier B — clarify counting rule |
| Reactivity granularity on objects (`user = {user with email: x}` re-renders all readers) | claude alone | 1/4 | Tier B |
| `fetch()` lifecycle (dedup / cancel-on-navigate / cross-screen cache) | claude alone | 1/4 | Tier B |
| `navigate to Detail item` — snapshot or live binding | claude alone | 1/4 | Tier B |
| `every` first-tick (immediate vs after-interval) | claude alone | 1/4 | Tier B |
| `every` lexical capture (latest values vs mount snapshot) | claude alone | 1/4 | Tier B — pin |
| `shared:` initialization timing (app-start vs first-access) | claude alone | 1/4 | Tier B |
| `is loading` / `is error` outside async — special-form scope | claude alone | 1/4 | Tier B |

## Tiered action list

### Tier A — strong signal (3-4/4 convergence). v0.14.2 docs-only patch candidates.

These should be pinned in the v0.14.2 cheatsheet patch:

1. **`fetch()` reactivity** — explicit rule: "`fetch(url)` re-runs whenever `url` (or `method:`/`body:`) is reassigned. The screen body's reactivity rule applies — `fetch` is a reactive call, not a one-shot, when its arguments depend on reactive state."
2. **`input bind: shared.X` exception** — pull into a boxed rule with code example, not a parenthetical.
3. **Derived state / dependency tracking** — explicit rule: "Variables defined in terms of other variables (`derived = base * 2`) recalculate on screen re-evaluation, not on the original assignment. Top-level `=` is initialisation; subsequent re-evaluations re-run the derivation." (Plus: clarify what's "rendering part" vs "init part".)
4. **Function-call reactivity tracking** — explicit rule: "Reactivity tracks references through function calls. `label total()` where `total()` reads `count` re-evaluates when `count` is reassigned."
5. **`emit` argument binding** — clarify in §Component Events. Positional or name-match? Pick one and write a sentence.
6. **`replace` / `without` multiplicity** — clarify in §Lists. First match or all? Pick one and document.
7. **Equality semantics on objects** — clarify in §Boolean logic. `{name: "a"} is {name: "a"}` — true (structural) or false (reference)? Pick one.
8. **Component re-evaluation** — clarify in §Components. Do components re-run on parent re-render? (Likely yes, given the lexical-reactivity model; needs one sentence.)

### Tier B — moderate signal (2/4 or single-model with high specificity)

Queue for a follow-up docs-only round; revisit if signal compounds:

- `on change:` programmatic-reassignment paragraph condensation
- Lists section regrouping (queries / transforms / mutations)
- Layout sibling-interaction rules as bulleted laws
- Recurrence/Pomodonut example simplification
- "verbose form is still legal" hedge under `{x with ...}` — pick a winner
- fetch-URL keystroke broken/fixed example expansion
- All single-model Q3 raises

### Tier C — single-model raises noted for awareness

GPT's restructuring suggestions ("Reacting to users" overloaded, "Getting input" scaffolding, styling section, end-rules duplicate). These are about whole-document structure rather than passage-level fixes. Not actionable on a docs-only patch; would need a Stage-2-style design pass on cheatsheet structure if signal compounds.

## Cross-cutting observations

### The convergent strengths are exactly the spec's load-bearing teaching moves

4/4 on the Todo intro + 4/4 on the lexical-reactivity rule + 3/4 on "why doesn't state reset?" — these are the three things the cheatsheet must do well, and the panel says they do. **Do not change them.** Future docs-only iterations should protect these passages even when restructuring around them.

### The convergent weaknesses cluster around v0.14.1's newest content

`input bind: shared.X` exception (3/4 weakest) and the `on change:` clarification paragraph (2/4 weakest) both ship in v0.14.1. The pattern: when a feature ships with edge cases, the cheatsheet absorbs prose explaining the edge cases, and that prose tends to be denser than the surrounding teaching. **Architectural takeaway:** for v0.15+, factor edge-case explanations out of the main teaching path into either (a) boxed rules, (b) a "subtleties" appendix, or (c) explicit exception-marked sub-sections. Don't let edge-case prose accumulate inline.

### The Q3 semantic uncertainty cluster is the most valuable signal

20+ items raised across 4 models, with 7 reaching ≥2/4 convergence. **The runtime model has more unspecified behaviour than the spec acknowledges.** Most items are docs patches (the runtime probably DOES something specific; the spec just doesn't say what) rather than implementation questions. v0.14.2 should pin the Tier-A items; v0.15 should consider a "Runtime guarantees" appendix that catalogues the resolved Tier-B items.

### Methodology validation: chat-mode review surfaces what panel-runs don't

The Stage 2 design review (`tests/v0.14-design-review/`) and Stage 3 cold tests are tied to specific spec changes; this review reads the *whole* document and flags gaps independent of what's being shipped. The 7 Tier-A Q3 items would not have surfaced in any of v0.14's stages. **Worth running this pass once per minor version** — e.g., after each `spec/vX.Y.0` ships, before the next minor cycle starts.

## Decision

Log the Tier-A action list as v0.14.2 docs-only iteration candidates. ROADMAP Stream 3 entry references this directory. Implementation deferred to a future docs-only session (Tyr to pick: bundle into one v0.14.2, or stretch across v0.14.2 + v0.14.3).

The criterion-4 #2 close stays unaffected — Pomodonut shipped 2026-04-26 (commit `f2b3ff0`); this review is forward-looking work for v0.14.2+.

## Cumulative v0.14 cycle cost

| Round | Cost |
|---|---|
| Stage 2 design review (timer) | $0.30 |
| Stage 0 cheatsheet review (timer) | $0.39 |
| Stage 3 (timer) | $0.41 |
| Pomodonut rerun against v0.14.0 | $0.35 |
| Stage 3 v0.14.1 (bind widening) | $0.46 |
| **Cheatsheet review (this round)** | **$0.00** (web-LLM chat) |
| **Cumulative** | **$1.91** |
