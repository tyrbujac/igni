# v0.20.0 cheatsheet review — chat-mode panel synthesis

**Date:** 2026-04-29. **Methodology:** per-minor-version chat-mode cheatsheet review (fourth precedent: v0.14.1, v0.15.0, v0.17.0, v0.19.1). Tyr ran 4 web-UI LLMs async, copy-pasted `spec/v0.20.0-cheatsheet.md` into each, asked the five-question template (Q1 strongest / Q2 weakest+prune / Q3 semantic uncertainty / Q4 cross-language-prior on v0.20 surface / Q5 fit-and-limits across three project shapes). $0 cost; ~30 min wallclock.

## Methodology note

Chat-mode review reads the *whole document independently*. Distinct from Stage 2/3 panels which probe specific design changes. Per the v0.14.1 README's framing: "chat-mode review surfaces what panel-runs don't." For v0.20, four panel runs already validated the new surface (Stage 2 + Stage 0 + Stage 3 + Reading-A absorption patches, all STRONG-PASS); this read measures the post-implementation cheatsheet's clarity for a reader going top-to-bottom without prompt-specific framing.

**Two new questions this cycle.** Q4 is v0.20-specific (cross-language-prior probe for theme variant pairs / sub-blocks / `shared.theme_mode` / auto-fall-back / spacing scale). Q5 is the new fit-and-limits probe across three project shapes ((a) Studio-like canvas+editor+inspector+AI-agent tool, (b) notes-app shape, (c) internal data-entry/dashboard). Q1–Q3 wording is verbatim from the v0.19.1 prompt for cross-version comparability.

Chat-mode artifacts: minor text-mangling artifacts from web UI copy-paste preserved as-is for traceability (Pro: "joy", "thinkisible", missing punctuation; Flash: stray backtick after `user = {name: "Tyr"}`).

## Panel

| Model | File | Notes |
|---|---|---|
| Gemini 3 Flash | `gemini-3-flash.md` | Tightest output. Most Q4-positive (4/5 surfaces "intuitive / direct hit / sweet spot"). Headline Q5: project (b) is Igni's "sweet spot"; project (c) limited by "Excel-like" desktop interactions. |
| Gemini 3.1 Pro | `gemini-3.1-pro.md` | Most architectural Q2 critique. Only cell to challenge the dual spacing system as an *alias-rule violation* (1/4 challenge to v0.20 lock). Concise; 1/4 cells to NOT raise reactive fetch race conditions in Q3 (raised it instead under "Reactive Fetch Race Conditions" — actually does raise it; correction: 3/4 cells raised it). |
| GPT 5.3 | `gpt-5.3.md` | Densest Q3 (seven distinct uncertainties). Names theme section as Q2 weakest. Strongest cross-language-prior framing in Q4 ("Igni is choosing Tailwind here — that's good, but should be explicit"). Q5 closes with the "80% app category" framing as the honest ceiling. |
| Claude Opus 4.7 | `claude-opus-4-7.md` | Densest Q3 (seven uncertainties, including a v0.20-specific one about auto-fall-back applying to structural sub-blocks). Most concrete Q5 walls list (no chart primitive of any kind, no date type, no pagination, no file upload). Aligns with GPT on theme as Q2 weakest. |

## Cross-version comparability note

The v0.19.1 panel found `§Reacting to users / derived-state callout` as 4/4 unanimous protect-at-all-costs. **v0.20.1 confirms 4/4 unanimous on the same finding** — second consecutive cycle. n=2 instance: the reactivity section is the durable spine of the cheatsheet, not a one-cycle artifact. The v0.19.1 1/4 mention of `every`-block on screen revisit (Pro+Opus) is *not* re-raised this cycle — the v0.19.1 patch may have absorbed it, or the cells didn't probe that surface in their independent reads.

## Convergence tables

### Q1 — What's strongest? (Protect, don't touch)

| Finding | Flash | Pro | GPT | Opus | Convergence |
|---|---|---|---|---|---|
| **`§Reacting to users` / `total = count * price` derived-state callout** | ✓ "masterclass" | ✓ "explicit confrontation… exceptional" | ✓ "clearest semantic core" | ✓ "the standout" | **4/4** |
| **Animation split (`transition:` vs `spring()`) — compiler-as-teacher** | — | ✓ "brilliant" | ✓ "excellent API design" | ✓ "good design and good docs reinforcing each other" | **3/4** |
| Todo example as entry-point tour | — | — | ✓ "earns its place" | ✓ "load-bearing" | 2/4 |
| PascalCase / lowercase enforcement | ✓ "brilliant design choice" | — | — | ✓ "small choice that pays off" | 2/4 |
| Event model (`on tap`, `on touch`, `on change`) | ✓ "exceptionally clear" | — | ✓ "small, coherent surface" | — | 2/4 |
| Strict token-only layout discipline | — | ✓ "massive strength" | — | — | 1/4 |
| Testing model mirrors language (no DSL weirdness) | — | — | ✓ "consistency matters" | — | 1/4 |
| Rule → pitfall → canonical shape pattern | — | — | ✓ | — | 1/4 |
| Smaller wins: `contains()` case asymmetry, `round()` returns string, reduced-motion `spring()` | — | — | — | ✓ | 1/4 |

**4/4 unanimous on Reactivity.** Combined with v0.19.1's 4/4: **n=2 protect-at-all-costs.** In the v0.20.1 prune, do not touch §Reacting to users. The "captures vs tracks" framing has now been independently named as "the spine / standout / masterclass / clearest semantic core" by 8 of 8 cells across two cycles.

**3/4 strong on animation split.** Was 1/4 in v0.19.1 (Opus alone); now Pro + GPT + Opus converge. Possibly the v0.19.1 patches sharpened it; possibly cross-cycle drift in cell perspective. Either way: protect.

### Q2 — Weakest section + prune candidates

| Finding | Flash | Pro | GPT | Opus | Convergence |
|---|---|---|---|---|---|
| **Theme section / dark-mode density / two `text:` surfaces collision** | — | — | ✓ "weakest section" | ✓ "the theme section" | **2/4** *(NEW v0.20-specific)* |
| **Recurrence / `every` block over-long** | ✓ "significantly more dense and logic-heavy" | — | ✓ "overly long for its semantic payload" | — | **2/4** |
| **Testing section over-sized for cheatsheet** | ✓ "belongs in a separate document" | — | ✓ "very strong conceptually but oversized" | — | **2/4** |
| **Lists / object equality density embedded with mutation** | — | ✓ "list mutation section is slightly cluttered" | ✓ "too much behavioural density around identity vs structural equality" | — | **2/4** |
| **Dual spacing system as alias-rule violation** | — | ✓ "actively contradicts your foundational rule" | — | — | **1/4 challenge to v0.20 lock** |
| Border / Selected-state pattern over-prescriptive | — | — | — | ✓ "veers prescriptive" | 1/4 |
| Bottom-anchored buttons (multiple `fill:true`) feels like CSS hack | — | ✓ | — | — | 1/4 |
| Strings builtins too austere without "store strings naturally" example | — | — | — | ✓ | 1/4 |
| `input bind: shared.X` exception buried in mid-section blockquote | — | — | — | ✓ | 1/4 |
| Structural sub-block introduction dense, single example mixes 3 ideas | — | — | — | ✓ | 1/4 |
| `snapshot` carries too much meta-info (file paths, git commits) | ✓ | — | — | — | 1/4 |

**2/4 strong on theme density** — both cells called it the *single* weakest section. v0.20-specific (theme block widened this cycle via dark variant + scaffold/appbar sub-blocks; the cheatsheet absorbed all of it in one section; the prose density spiked accordingly). The two-`text:`-surfaces ambiguity is the load-bearing complaint within the section.

**2/4 cross-cycle on Recurrence + Testing** — v0.19.1 had 1/4 on each (GPT alone for testing-overweight; nothing for recurrence). v0.20.1 confirms both. Suggests the prune candidates have been latent across cycles and are worth acting on.

**2/4 on Lists / object equality** — v0.19.1 had Pro flag "object mutation buried" + 2/4 on "without/replace reference-equality trap." v0.20.1 GPT + Pro converge again. The semantic shape (object equality is reference-based) is a recurring teaching trap that keeps surfacing as cheatsheet density problem.

**1/4 challenge to v0.20 lock**: Pro proposes the dual word/numeric spacing system violates "one way to do everything." This is a Tier-C re-design candidate, not a v0.20.1 prune. The S0-3 Stage-0 lock (word tokens for semantic shorthand, `spacing/N` for specific px values) was an *empirical heuristic*, not a strict alias prohibition. Worth surfacing to the design log; not actionable as a docs patch.

### Q3 — Genuine semantic uncertainty (teaching gaps)

| Finding | Flash | Pro | GPT | Opus | Convergence |
|---|---|---|---|---|---|
| **Reactive fetch race conditions / async invalidation semantics** | ✓ "if a user triggers three rapid `fetch` calls — does Igni cancel?" | ✓ "**dangerously silent** on reactive fetch race conditions" | ✓ "is the old request cancelled? Can stale responses win?" | — | **3/4** |
| **Each-row identity / component identity in lists / `spring()` inside `each`** | — | — | ✓ "identity in a list… tied to item identity or tree position?" | ✓ "the term is never defined" | **2/4** |
| Component local state (can a component hold its own boolean?) | — | ✓ "entirely unclear" | — | — | 1/4 |
| Function dependency tracking depth (transitive? conditional reads?) | — | — | ✓ "what exactly is tracked?" | — | 1/4 |
| Navigation lifecycle / state persistence on `navigate back` | — | — | ✓ "previous screen instance persist or reconstruct?" | — | 1/4 |
| Shared state atomicity / concurrent updates | — | — | ✓ "is `shared.update()` transactional?" | — | 1/4 |
| Null propagation depth (does method invocation null-propagate?) | — | — | ✓ | — | 1/4 |
| Fetch caching / memoisation (per-URL? fresh every render?) | — | — | ✓ | — | 1/4 |
| Lambda body — can it call screen-internal functions? | — | — | — | ✓ "looks like it should work… I'd be guessing" | 1/4 |
| **Auto-fall-back applies to structural sub-blocks?** *(v0.20-specific gap)* | — | — | — | ✓ "the example redeclares both and the prose doesn't pin this down" | 1/4 |
| `locate()` lifecycle on screen revisit | — | — | — | ✓ | 1/4 |
| Persistence (local storage) absent from cheatsheet | — | — | — | ✓ "a notes/settings app needs that immediately" | 1/4 |
| `seen "string"` matching with concatenated label primitive | — | — | — | ✓ | 1/4 |
| `fetch()` error inside `every` block — persists or clears? | — | — | — | ✓ | 1/4 |
| List/object identity in `shared:` state across screens | ✓ "shared: state handles this across re-renders or file boundaries" | — | — | — | 1/4 |
| `layout horizontal` overflow behaviour (wrap / clip / scroll?) | ✓ | — | — | — | 1/4 |

**3/4 on reactive fetch race conditions** — strongest semantic-gap finding this cycle. Three cells independently raised the *same* shape: rapid input-bound fetches, do they cancel / dedupe / race / latest-wins? Pro called the cheatsheet "dangerously silent." This is a methodology-grade gap: surfaced cold, convergent, names the missing teaching directly. The Async section warns against `bind` directly to fetch URL but does not document what happens when the bound value (e.g., `shared.X` driven by a non-input action that changes rapidly) does change rapidly.

**2/4 on each-row / component identity** — GPT + Opus converge on the same shape (what is the identity primitive when `each` row state matters? object reference? key argument? structural?). The animation section uses "row identity" without defining it. Real gap.

**1/4 v0.20-specific: auto-fall-back rule and structural sub-blocks** — Opus alone, but methodology-grade because the v0.20 cheatsheet's example redeclares `scaffold:` in both light and dark blocks. Does dark omitting `scaffold:` inherit light's? Or is the auto-fall-back rule scoped to colour/text tokens only? Spec gap. Cheap to test against the transpiler and document.

### Q4 — Cross-language-prior check (v0.20 surface)

| v0.20 surface | Flash | Pro | GPT | Opus | Convergence verdict |
|---|---|---|---|---|---|
| **`spacing/N` numeric scale** | ✓ "direct hit for Tailwind users… industry standard" | ✓ "feel right at home" | ✓ "lands very cleanly… cleanest v0.20 addition" | ✓ "cleanest alignment in v0.20" | **4/4 cleanest landing** |
| **Theme variant pairs** (`theme:` + `theme dark:`) | ✓ "highly intuitive for Tailwind/CSS users" | ✓ "captures declarative joy of SwiftUI / Compose" | ✓ "readers will largely guess right" | ✓ "Compose user will guess correctly" | **4/4 generally clean** (CSS-only readers hunt for media-query) |
| **Auto-fall-back rule** *(divergence-from-prior risk)* | ✓ "strong QoL feature" | ✓ "perfectly mirrors CSS custom properties" | ✓ "best-designed part… subtle risk: 'absence in dark = use default dark token'" | ✓ "**diverges from every prior** — Tailwind reader will be surprised" | **3/4 raise risk** (Pro praises positively, others flag) |
| **`shared.theme_mode` "system" as assignable state** | ✓ "slight friction… 'system' is environment variable you read, not assign" | ✓ "SwiftUI users… looking for injected env variable or enum" | ✓ "users may not expect 'system' itself to be mutable state" | ✓ "aligns cleanly… 'system' as default is right" | **3/4 raise friction; Opus dissents** |
| **Structural sub-blocks (`scaffold:` / `appbar:` / `text:`)** | ✓ "map cleanly to Material Design / Flutter priors" | — | ✓ "Compose prior helps a lot… SwiftUI prior hurts slightly" | ✓ "map onto Material's nested theme shape" | **3/4 generally clean** |
| **`text:` keyword collision (typography vs colour)** | — | — | ✓ "violates the 'one meaning per word' instinct" | ✓ "the one place priors actively mislead" | **2/4 — same finding both cells** |
| **`spacing/N` whitelist constraint** *(vs Tailwind escape hatches)* | — | — | ✓ "Tailwind user will reach for `spacing/7`" | ✓ "surprises CSS readers" | **2/4** |
| Tailwind dark-mode inline override paradigm shift (centralised dark block) | — | ✓ "severe paradigm shift… initially frustrate users" | — | — | 1/4 |
| **Dual word + numeric spacing as cross-prior pick** | — | — | ✓ "Igni is choosing Tailwind here — should be explicit" | — | 1/4 (positive framing — "good choice, should be explicit") |

**4/4 unanimous: `spacing/N` is the cleanest v0.20 addition.** Validates Path C (Igni primitives stay translatable from Tailwind / industry-standard 4px scale). Protect this design choice; it's the single most-converged-on positive finding for the v0.20 spec surface.

**4/4 generally clean: Theme variant pairs.** SwiftUI / Compose / Tailwind users guess right. CSS-only readers (i.e., readers without a mobile-framework prior) hunt for `@media (prefers-color-scheme: dark)` and find their answer under `shared.theme_mode`. Worth a one-line cross-reference in the cheatsheet ("This is the SwiftUI/Compose declarative pair, not the CSS conditional") per Opus's specific suggestion. Tier-A.

**3/4 + 1 dissent: Auto-fall-back rule has a divergence-from-prior risk.** Three cells flag it at varying intensity (Pro positively says it cascades like CSS custom properties; GPT says subtle misread risk; Opus says it diverges from every prior including Tailwind). The conflict between Pro and Opus is real — both readings have CSS support (custom-property cascading vs `prefers-color-scheme` redeclaration), but the *Tailwind* prior consistently requires redeclaration. The cheatsheet currently states the rule once. **Tier-A: strengthen with a "Tailwind/Compose readers: this differs from your prior — omissions in dark inherit from light" callout.**

**3/4 on "system" as assignable state friction.** Three cells say "system" reading-as-state will surprise CSS / SwiftUI / generic web readers (where system preference is ambient and read-only). Opus dissents (says it aligns with SwiftUI's `preferredColorScheme(_:)`). Tier-B candidate: rephrase the `shared.theme_mode` line to describe the assignment as a *user preference* that *overrides system*, not as overwriting "system" itself.

**2/4 on `text:` keyword collision.** GPT and Opus name the same teaching wart: `text:` under `theme:` means typography; `text:` under `color:` means a colour token. Every other framework keeps colour and typography in separate top-level branches. This was Opus's Q2 main finding; reinforced under Q4 by both cells. Tier-A: this section needs a structural rewrite (rename one, or visually disambiguate with a "where can `text:` appear?" inset). The principled-minority pattern (`docs/private/114`) applies — the spec design landed via the absorption shape; the cheatsheet teaching is now the part that needs the same treatment.

### Q5 — Fit and limits (three project shapes)

#### (a) Studio-like: canvas + source editor + state inspector + AI-agent layer

**4/4 convergence shape**: Igni works for the *chrome* (toolbars, dropdowns, splits, modals, panel layouts); the *canvas itself* hits a wall.

- **Walls (3+/4)**: no canvas primitive (no paths / drawing / SVG embed / absolute positioning / z-index / drag-and-drop coordinate handling) — Flash + Pro + GPT + Opus
- **Walls (1-2/4)**: code-editor surface (no monospace / cursor management / syntax highlighting / virtualised line rendering) — Opus; AI streaming primitive (`fetch()` is request/response, no token-stream story) — Opus; keyboard-shortcut layer absent — GPT + Opus; selection models / undo stacks / drag handles — GPT
- **Common recommendation**: chrome in Igni, canvas hosted in Flutter directly. Possibly write the whole thing in Flutter to avoid the boundary.

This **directly informs the Igni Studio strategic doc** (`docs/private/115`) — the panel's canonical-claim falsification (visual round-trip is bounded, AST round-trip is total) is corroborated by 4/4 cells reading the cheatsheet cold without any Studio framing. The walls list maps almost 1:1 onto the Studio "behavioural primitives that don't visually round-trip" inventory.

#### (b) Notes-like: list + editor + settings, multi-screen navigation

**4/4 convergence shape**: Igni's **sweet spot**. The Todo example *is* this app at smaller scale (Opus's exact framing).

- **Maps cleanly (4/4)**: multi-screen navigation, `shared:` state, `each` for list, `input bind:` for editing, `shared.theme_mode` + `toggle bind:` for settings
- **Walls (4/4)**: rich-text editing (bold / italic / inline images) — Flash + Pro + GPT + Opus
- **Walls (3/4)**: persistence absent from cheatsheet (notes need to survive app restart; `fetch()` is a network story, not local) — GPT + Opus + (implicit Pro)
- **Walls (1/4)**: `input` implicitly single-line (no `multiline:` modifier shown) — Opus; search debounce awkward (cheatsheet warns against binding fetches to input) — GPT

**This directly validates the v0.20+ design horizon** (`docs/private/116` Boojy Notes MVP partial-close). Persistence (`persist()`) was already on the v0.20+ candidate list per the app 2 scoping decision; chat-mode review independently reaches the same gap from the cheatsheet read. Rich-text editing is a v0.21+ candidate — surfacing here means the "primitives NOT in use" gap-mapping evidence stream now has a third source (panel + app 2 + cheatsheet review).

#### (c) Internal data-entry / dashboard tool

**4/4 convergence shape**: Strong fit for forms; charts / tables / dates / pagination / file upload = walls.

- **Maps cleanly (4/4)**: form chrome (`input`, `dropdown`, `checkbox`, `toggle`, `slider`), validation via `on change`, results lists via `each`, polling via `every`
- **Walls (4/4)**: chart primitive (no bar / line / scatter / pie of any kind) — implied Flash + Pro + GPT + Opus
- **Walls (3/4)**: complex tables (sortable / resizable / sticky-header / virtualised long tables / column-resize / multi-sort) — Flash + Pro + GPT + Opus
- **Walls (2/4)**: virtualisation — GPT + Opus; date primitives (date type / picker) — Opus; drag-drop — GPT + Opus; advanced charting — Pro + GPT + Opus
- **Walls (1/4)**: pagination, file upload — Opus; custom gestures — GPT

**Cross-cutting v0.21+ candidate list from Q5 (a)+(b)+(c)**: chart primitive, table primitive (with sort/resize/sticky/virtualisation), persistence, rich-text editing, date type+picker, file upload, pagination, drag-drop. All surfaced cold by chat-mode review without Tyr-side framing. **Should drive ROADMAP Stream 3 prioritisation.**

## Tier decisions

### Tier A — Ship as v0.20.1 (4/4 unanimous or 3/4 strong)

| # | Finding | Action |
|---|---|---|
| **A1** | §Reacting to users is 4/4 protect (n=2 cycles) | **Don't touch.** Keep the section's framing exactly as-is in v0.20.1. Mark in `docs/private/118` as durable methodology pattern. |
| **A2** | Reactive fetch race conditions / async invalidation 3/4 | **Document the rule.** Either add a "Reactive fetch race conditions" callout to the Async section (latest-wins / cancellation / debounce — pick the actual transpiler behaviour) **or** open a v0.21+ design note if the rule is undecided. Methodology-grade gap; cannot ship v0.20.1 without choosing one path. |
| **A3** | Auto-fall-back diverges from Tailwind/Compose prior 3/4 | **Strengthen the callout.** Rephrase the auto-fall-back rule with an explicit "Tailwind/Compose readers: this differs from your prior — omissions in dark inherit from light" inset. Per Opus's specific suggestion. |
| **A4** | `text:` keyword collision (typography vs colour) 2/4 (Q2+Q4 both cells, also Opus's Q2 weakest) | **Structural rewrite of theme section.** Either rename one of the `text:` surfaces, or visually disambiguate with a "where does `text:` appear?" inset. The section is currently 2/4 weakest; this is the load-bearing fix. |
| **A5** | Cross-cutting v0.21+ wall list from Q5 | **Update ROADMAP Stream 3** with: chart primitive, table primitive, persistence, rich-text editing, date type+picker, file upload, pagination, drag-drop. Each entry tagged "chat-mode v0.20.1 review signal: 2-4/4." |

### Tier B — Editorial-judgement candidates for v0.20.1

| # | Finding | Note |
|---|---|---|
| **B1** | Recurrence section over-long 2/4 | Prune lifecycle paragraph + duration-whitelist into one tighter passage; move "missed-tick" detail to a callout. |
| **B2** | Testing section over-sized for cheatsheet 2/4 | Either split into a separate `spec/v0.20.0-testing.md` companion **or** prune the snapshot subsection's path/git-commit detail. |
| **B3** | Lists / object equality embedded with mutation 2/4 | Promote object equality to its own dedicated semantics callout adjacent to (not embedded within) the list section. |
| **B4** | Each-row identity definition 2/4 | Define "row identity" explicitly in animation/each context. Cheap; methodology-grade because Q3 also raises it. |
| **B5** | spacing/N whitelist constraint 2/4 | Add stronger flag that 1-8 is the *complete* set; numeric `gap: 12` is rejected. Tailwind users will instinctively try escape hatches. |
| **B6** | "system" as mutable state friction 3/4 | Rephrase `shared.theme_mode` to frame the assignment as a *user preference* that *coexists with* system, not as overwriting "system." |

### Tier C — 1/4 challenges to existing locks (surface to design discussion)

| # | Finding | Action |
|---|---|---|
| **C1** | Dual word + numeric spacing as alias-rule violation (Pro) | **Don't flip.** S0-3 Stage-0 lock was empirical (numeric for px, word for semantic). 1/4 challenge below threshold; log to `docs/private/119` as a recorded counter-argument. Re-running Stage 2 on this is a re-design, not a v0.20.1 patch. |
| **C2** | Auto-fall-back applies to structural sub-blocks? (Opus) | **Spec gap; resolve via fixture.** Cheap to test against the transpiler and document the answer. Tier-A-adjacent but treated as Tier-C because only 1/4 raised it; will get verified during the v0.20.1 patch pass. |
| **C3** | Lambda body — can call screen-internal functions? (Opus) | **Spec gap; cheap to test+document.** Tier-A-adjacent like C2; resolve during v0.20.1 patch. |
| **C4** | Component local state (Pro) | **Long-tracked open question.** Already on the v0.7+ backlog (`CLAUDE.md` Tracked Open Questions); 1/4 raise this cycle confirms it's still latent. Stays deferred to v0.21+. |
| **C5** | Function dependency tracking depth (GPT) | **Spec gap.** Affects the reactivity rule's edge cases; document at the same time as A2 (reactive fetch). |
| **C6** | Navigation lifecycle / state on `navigate back` (GPT) | **Spec gap.** Adjacent to recurrence-on-resume rule (already documented for `every`); same shape needs documenting for screen state. |
| **C7** | Tailwind dark-mode inline override paradigm shift (Pro) | **Don't accommodate.** v0.20 spec explicitly rejected inline overrides per Stage 2 panel debate. 1/4 reader-friction is the expected cost of the Path-C centralised-theme decision; not a re-open trigger. |
| **C8** | Persistence absent from cheatsheet (Opus, also implied by GPT in Q5) | **Already on v0.21+ candidate list** per `docs/private/116` app 2 scoping. Confirms the existing prioritisation. |
| **C9** | Border / Selected-state pattern over-prescriptive (Opus) | **Move to patterns guide** when one exists. Currently 1/4; not a v0.20.1 prune unless the patterns guide ships. |
| **C10** | Strings builtins too austere (Opus) | **Add example.** "Store strings naturally, format at render" example would land in <50 words; Tier-B-candidate but only 1/4. Defer unless v0.20.1 pass has spare bandwidth. |

## Cycle status

| Stage | Status |
|---|---|
| Cheatsheet review prompt | ✓ shipped (`prompt.md`) |
| 4 cell outputs collected | ✓ all four (Flash / Pro / GPT / Opus) |
| Synthesis README | ✓ this file |
| Tier-A patch design | pending |
| Tier-A patches landed → v0.20.1 ship | pending |

**Cumulative v0.20 cycle cost remains $1.85** (chat-mode review is $0). v1.0 criterion 1 clock unchanged at 2026-04-29 (v0.20.1 docs-only patches do not reset the breaking-change clock per `docs/private/83` precedent).

## Methodology log

This is the **fourth cheatsheet-review precedent** (v0.14.1, v0.15.0, v0.17.0, v0.19.1, v0.20.1). Three observations worth carrying forward:

1. **n=2 protect-at-all-costs pattern** — `§Reacting to users / derived-state callout` was 4/4 in both v0.19.1 and v0.20.1. Two cycles is the convention threshold for "durable methodology pattern, not artifact" per the no-flips-no-patches precedent (`docs/private/117_methodology_chapter_draft.md` §4d). This now applies to chat-mode protect-at-all-costs findings as well.
2. **Q4 + Q5 design (this cycle)** added two new question types: cross-language-prior probe (v0.20-specific) and fit-and-limits across three project shapes. Both produced strong convergence and load-bearing signal (`spacing/N` 4/4 cleanest landing; Studio/Notes/Internal walls 4/4 each). Worth retaining for future cheatsheet reviews — modify Q4 each cycle to reflect the version's new surface.
3. **Real-app horizon validation via chat-mode** — Q5's notes-app and dashboard walls *exactly* mirror gaps surfaced empirically by app 2 scoping (`docs/private/116`) and Studio strategic doc (`docs/private/115`). Cross-source convergence (panel + real-app + cheatsheet review) is the methodological pattern the dissertation chapter §4 cites; v0.20.1 is the third concrete instance.
