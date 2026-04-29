# v0.20 dark-mode propagation design review — Stage 2

Stage 2 panel — 3 frontier models critique design note 118 (`docs/private/118_v020_dark_mode.md`) before any spec edit lands. The doc proposes Workstream A of v0.20: theme-block widening to express dark-mode propagation across scaffold, AppBar, default-text, and user-defined tokens. Three shape proposals are on the table (a sub-blocks / b `theme: dark:` pair / c semantic-tokens widening). The note recommends a lean for Stage 2 debate: option (b) with structural separation between token definitions (compile-time) and active-theme selection (runtime).

Run via `npx tsx tests/runner/cold-test.ts --no-spec --no-grade --prompts tests/v0.20-design-review/prompts.md --out tests/v0.20-design-review --models claude-opus-4-7,gpt-5.5,gemini-3.1-pro-preview`. Outputs are prose, not Igni code.

Why a Stage 2 against the framing: this is the project's first **theme-block primitive class extension** since v0.18 added `theme: text:` / `theme: color:`. Two of three shape proposals (a, c) preserve the existing v0.18 "no runtime-derived theme tokens" rule; option (b) — the recommended lean — requires *narrowing* that rule. The panel's most load-bearing job is to either confirm the narrowing is structurally honest (token *definitions* stay compile-time; *variant selection* becomes runtime) or surface a load-bearing reason why narrowing this rule weakens the language at a v1.0 horizon.

**Q1 is framed adversarially** — *the strongest case AGAINST option (b)* — because the recommended lean is well-justified enough that anchoring is a real risk. The principled-minority pattern (`docs/private/114`, three instances) is the architecture-side guard for "panel agrees with recommendation but architecture should reverse"; this anti-anchoring Q1 is the panel-side guard for "panel agrees with recommendation but the agreement is anchoring rather than load-bearing critique."

Treat panel responses as input to a Tyr decision, not the decision itself. Patch decision (per spec-cycle skill rules): 3/3 convergent on a refinement → patch doc 118; 2/3 → consider; 1/3 → log only. Trigger A in doc 118 fires if 2/3+ flip option (b) on architectural grounds (not just "smaller is better"); Tyr applies principled-minority-pattern heuristic.

## 1. v0.20 dark-mode propagation design critique

> You are reviewing a design note for the Igni programming language ahead of v0.20 implementation. Igni is a UI-first programming language with the north star "Flutter, without the bracket hell" — indentation and colons replace braces, no parentheses on component invocation, no string interpolation, one way to do everything. The language is designed for both human readability AND LLM accuracy: every alternative or alias is treated as a branch where an LLM can guess wrong.
>
> A few load-bearing design principles for context:
>
> - **Spec budget, not backlog**: every new keyword/syntax form is a tax on zero-shot LLM learnability. Optimise for rule simplicity, not output verbosity.
> - **One way to do everything**: every alternative form is rejected on principle.
> - **No magic**: if something happens at runtime, the cause should be visible in source.
> - **Indentation, no brackets**: block structure is whitespace + colons.
> - **PascalCase = component (no parens), lowercase = function (with parens).**
> - **Lexical reactivity**: each screen re-evaluates from the top whenever any variable it references is reassigned.
> - **Path C** (committed v0.15+): designs translate from Figma's auto-layout vocabulary; primitives match Figma's model rather than reinventing.
>
> v0.19 just shipped (animation primitives + snapshot testing — `transition: fade`/`slide`, `spring(value)`, text-tree snapshot, `mock now:`/`freeze_time:`). v0.20's scope locked 2026-04-29 to three workstreams: Workstream A (this note: dark-mode propagation), Workstream B (wider spacing tokens 4/8/12/16/20/24/32), Workstream C (`lint-spec-trio.ts` — Stream 2 cheatsheet-lint tooling). Shadow slipped to v0.21 candidate (zero real-app signal vs dark-mode's 2-of-2). Accessibility stays in v0.21.
>
> Two real-app instances surfaced the dark-mode gap: (1) Gemini-3-flash zero-shot Pomodoro 2026-04-27 reached for `if shared.dark_mode:` *inside* the top-level `theme:` block (runtime-derived theme values, ruled out by v0.18's `theme:` rule); (2) Boojy Notes MVP 2026-04-28 attempted dark theme via per-layout `background: black` + per-label `color: white` and AppBar stayed light no matter what (no override path) — 30+ annotations across a 90-line app to express dark mode. Both attest dark mode is a primitive class real apps need, the current spec doesn't express it, and the gap forces user-side workarounds that produce poor LLM-output and poor real-app maintenance.
>
> The design note below recommends a lean for the panel to debate. Read it carefully, then answer the six specific questions at the end. Be substantive and direct.
>
> ---DESIGN NOTE START---
>
> ## 118 — v0.20 dark-mode propagation (Workstream A)
>
> ### Three shape proposals
>
> **Option (a) — Sub-blocks: `theme: scaffold:` + `theme: appbar:`**
>
> Extends the existing `theme: text:` / `theme: color:` pattern with two more sub-blocks. Compile-time only; no runtime selector concept.
>
> ```igni
> theme:
>   color:
>     brand: "#80CBC4"
>     card: "#1D1E33"
>   scaffold:
>     background: card
>   appbar:
>     background: card
>     foreground: white
> ```
>
> *Blast radius:* small. New sub-block grammar in parser. New resolvers in codegen-helpers. Spec rule fully preserved. *What it doesn't solve:* dark mode is fundamentally a runtime question — system theme can change mid-session, user preferences differ from system. With (a), to ship a dark-mode-toggle app the user manages two `theme:` block variants in their head + manually swaps everywhere. The 30-annotation Boojy workaround stays painful, just better-organised.
>
> **Option (b) — `theme: dark:` pair with structural separation** *(recommended lean for debate)*
>
> Top-level `theme dark:` block as a sibling to `theme:` (default = light variant). Both compile-time (no runtime-derived token values inside either). Runtime selector at the variant level — OS appearance via `MediaQuery.platformBrightnessOf`, `shared.dark_mode` toggle, or both.
>
> ```igni
> theme:
>   color:
>     brand: "#80CBC4"
>     card: "#FFFFFF"
>     surface: "#F5F5F5"
>
> theme dark:
>   color:
>     brand: "#80CBC4"
>     card: "#1D1E33"
>     surface: "#0D0D14"
> ```
>
> Active variant selected at runtime by: default (follows OS via `MediaQuery.platformBrightnessOf(context)`), or override via `shared.dark_mode` (boolean: `true` = force-dark, `false` = force-light, `null` = follow-OS).
>
> *Blast radius:* largest. New top-level grammar (`theme dark:`). Runtime-selector design (which mechanism, how it composes). Codegen needs `MaterialApp(theme:, darkTheme:, themeMode:)` integration. Possible new spec rule narrowing: "tokens resolve at compile-time, *but* variant selection is runtime." *What it solves:* the actual problem real-app users have. App responds to OS appearance changes mid-session. User can override via toggle. Both Boojy's AppBar gap and Gemini-3-flash's `if shared.dark_mode:` reach become canonical patterns, not workarounds.
>
> **Option (c) — Semantic-tokens widening of `theme: color:`**
>
> Add `scaffold_background:`, `appbar_background:`, `default_text:` as accepted token names inside `theme: color:`. No new sub-blocks; no runtime selector.
>
> ```igni
> theme:
>   color:
>     brand: "#80CBC4"
>     card: "#1D1E33"
>     scaffold_background: card
>     appbar_background: card
>     default_text: white
> ```
>
> *Blast radius:* smallest. No new parser shapes. New token-name validator entries. *What it doesn't solve:* same as (a) — no runtime selection. Plus mixes structural concerns (scaffold = chrome) with semantic concerns (default_text = content) into the same colour bag — `scaffold_background` is a different *kind* of token than `brand`. Stage 0 risk: frontier LLMs may not reach for `scaffold_background` because the bag is so heterogeneous they can't infer it exists.
>
> ### The compile-time-token rule — reframed as open question, not preserved constraint
>
> The existing v0.18 `theme:` rule reads: *"token references resolve at compile-time; no runtime-derived theme values."* This was designed to prevent shapes like `if shared.X: brand: "#blue" else "#red"` — runtime-computed *token values* — which would break the cheatsheet's promise that color tokens are static teachable units.
>
> It was *not* designed with **active-theme selection** in mind. Selecting between two static token sets is structurally different from computing token values dynamically. Peer-language precedent reinforces the distinction: SwiftUI (`@Environment(\.colorScheme)`), Jetpack Compose (`isSystemInDarkTheme()`), Tailwind (`dark:` variant + `class="dark"`), CSS (`@media (prefers-color-scheme: dark)`). In all four, **tokens are static; selection is dynamic** — the compile-time rule for *definitions* coexists with a runtime mechanism for *selection*. Igni's current rule conflates them.
>
> The honest design question for this note isn't "which option fits the rule" — it's **"is the rule load-bearing for active-theme selection, or only for color/font definitions?"** Options (a) and (c) preserve the rule entirely. Option (b) requires narrowing the rule: tokens stay static; selection between two static token sets becomes dynamic.
>
> ### Recommended lean: option (b) with structural separation
>
> Three convergent reasons:
>
> 1. **Real-app signal compounds toward runtime selection.** Both 2-of-2 instances pointed at runtime mechanics (Gemini-3-flash directly via `if shared.dark_mode:`; Boojy indirectly via "AppBar stays light no matter what" — a gap that surfaces because dark-mode is a runtime question). Options (a) and (c) close the symptom; (b) closes the underlying ask. If v0.20 ships (a) or (c), the next real-app instance likely reopens the same primitive class for v0.21 with different surface area.
>
> 2. **Path C precedent commits to the design-by-translating shape.** Figma's variable modes ARE light/dark variant pairs — exactly option (b). The v0.15+ Path C lock said designs translate from Figma, not the other way around. (a) and (c) are design-by-reinventing.
>
> 3. **Peer-language convergence is 4-of-4.** SwiftUI / Compose / Tailwind / CSS-prefers-color-scheme all separate definitions from selection. Igni's `theme:` block currently does only definitions; (b) adds the selection mechanism that every adjacent ecosystem already has.
>
> The trade is real: bigger spec surface, runtime-selector design, codegen complexity for variant switching. The Stage 2 panel's job is to stress-test whether the trade is worth taking.
>
> ### Locked sub-questions for the panel
>
> If option (b) wins, four further sub-questions need settling:
>
> - **Runtime selector mechanism.** Three candidates: (b.i) OS-only via MediaQuery; (b.ii) `shared.dark_mode` toggle only; (b.iii) both with override semantics (`null` follows OS, `true` force-dark, `false` force-light). Recommended lean: (b.iii).
> - **User-defined token composition with dark variant.** When user declares `theme: color: primary_700: "#0D47A1"`, what happens in `theme dark:`? (c.i) strict-pair: error if not declared in dark too; (c.ii) auto-fall-back to light value; (c.iii) auto-derive (relative-luminance flip). Recommended lean: (c.i) strict pair.
> - **Default-text override scope.** `default_text:` (or option-a/c equivalent) overrides what? (d.i) all text; (d.ii) structural text only (AppBar, scaffold); (d.iii) per-token (`heading_text:`, `body_text:`). Recommended lean: (d.i).
> - **Forward-coupling rule.** Token references in `border:` / future `shadow:` resolve to active variant's value. Should v0.20 spec text commit to this rule now (so v0.21 `shadow:` builds on it) or defer? Recommended lean: commit now.
>
> ### Path C lens
>
> Figma's Variables feature ships with a **modes** primitive — a Variable can have multiple values (one per mode), and a frame "selects" a mode at use time. Light/dark mode is the canonical use case. Option (b) maps cleanly: `theme:` = mode-1 = "Default/Light," `theme dark:` = mode-2 = "Dark." Selection mechanism (OS via MediaQuery / `shared.dark_mode`) translates to Figma's mode-selection API. Options (a) and (c) require a Studio-side translation layer when importing a Figma file with light/dark mode variables — Studio must produce two `theme:` block variants OR a wider `theme: color:` semantic-token bag.
>
> ### Watch-list — falsification triggers
>
> - **Trigger A — Stage 2 (this panel) flips option (b).** If 2/3+ cells argue against (b) on architectural grounds — citing a load-bearing invariant the recommendation weakens, OR a real-app shape (b) closes off that (a)/(c) leave open — option (b) re-opens. Apply principled-minority-pattern heuristic: architectural objection over panel majority IF objection cites a named invariant; defer to panel IF objection is "smaller is better" without a load-bearing reason.
> - **Trigger B — Implementation cost surprise** (>3 sessions): mark v0.20 *partial*; split.
>
> ---DESIGN NOTE END---
>
> Now answer six specific questions. Be substantive and direct. If you genuinely converge with the recommended lean, say so explicitly — convergence is data. If you'd reject the lean, name the alternative and the cost. Treat each Q as either *hold* (lean survives), *refine* (small patch within the lean), or *flip* (lean fails — name the alternative).
>
> **Q1 — Strongest case AGAINST option (b)** *(anti-anchoring; the highest-pressure question)*. The recommended lean for (b) is well-justified enough that you may agree with it without genuine critique. Don't evaluate the three options. Argue specifically *against* (b). What does (b) cost the language at a v1.0 horizon? What load-bearing invariant does it weaken that (a) or (c) preserve cleanly? What real-app shape does (b) close off that the simpler shapes leave open? What's the strongest reason to ship (a) or (c) at v0.20 and defer the selection mechanism to v0.21+? If you can't construct a substantive case against (b), say so explicitly — that's also data.
>
> **Q2 — Runtime selector mechanism (assuming (b) survives Q1).** Three candidates: (b.i) OS-only via MediaQuery; (b.ii) `shared.dark_mode` toggle only; (b.iii) both with override semantics. Recommended lean is (b.iii). Pressure-test it: are there shape variants the recommendation doesn't cover (e.g. per-route theme override; programmatic theme animation; deferred-load themes)? Does (b.iii) compose correctly with Igni's lexical-reactivity model — specifically, does a `shared.dark_mode` change re-render every screen that references theme tokens, and is that the right semantic? Is the (b.iii) tri-state (`null` = follow-OS) clean for LLM authoring, or does it produce a gap where models forget to handle one of the three states?
>
> **Q3 — User-defined token composition with dark variant.** Recommended lean: (c.i) strict pair — error at parse if `theme: color: primary_700:` exists but `theme dark: color: primary_700:` doesn't. Pressure-test: is strict-pair the right discipline, or does it produce friction when 80% of brand-tokens look identical in light + dark and only 20% need distinct values? Would (c.ii) auto-fall-back (missing dark variant inherits light) be cleaner if the cheatsheet teaches "declare in dark only when distinct"? Or does fall-back risk invisible bugs (designer forgets to specify dark, ships light-rendered card on dark background)? Concrete shape: in a real Figma file with 23 user-defined color tokens, how many would actually have distinct dark variants?
>
> **Q4 — Default-text override scope and the structural-vs-semantic boundary.** The lean for (b) — and (c) — introduces tokens that span two distinct concerns: *structural chrome* (scaffold background, AppBar background) and *semantic content* (default text colour, possibly headings/captions). Q4: is mixing these in one block (whether `theme: color:` for option c or `theme dark: color:` for option b) the right shape, or should the design split them — `theme: color:` for content, `theme: chrome:` (or similar) for scaffold/AppBar/structural surfaces? Specifically: does the cheatsheet teach the distinction cleanly when colour tokens like `default_text` and `appbar_background` sit in the same bag as user tokens like `brand` and `surface_elevated`? Or does the bag heterogeneity reduce LLM canonical-shape adoption?
>
> **Q5 — Forward-coupling with `border:` and future `shadow:`** (v0.21+ candidate). The lean commits now to the rule "token references resolve to the active variant's value" — so `border: thin, color: subtle` flips its colour when theme switches. Pressure-test: is committing the rule now the right call, or does the v0.21 `shadow:` design need flexibility (e.g. shadow elevation tokens that are physically different in light vs dark — heavier in dark to compensate for low contrast)? Concrete: if v0.21 `shadow:` ships preset levels (`thin/medium/thick`-like vocabulary, per Path C visual-chrome methodology), does the active-variant-resolution rule make sense for *elevation* tokens, or does it conflate concerns the future design wants to keep separate?
>
> **Q6 — Anything load-bearing the design note missed.** Open-ended. Pressure-test the framing — not just the answers, but whether the question set itself is the right one. Is there a v1.0-horizon concern (composability with future a11y; programmatic theming for accessibility tools like high-contrast or large-text mode; per-component theme override; theme transition animation, since v0.19 just shipped `transition:`) that the design note doesn't address but should before v0.20 spec text locks? Is the bundling with Workstreams B + C (spacing tokens + lint-spec-trio) the right scope, or does the dark-mode design merit its own minor-version cycle? If you'd push back on the framing itself, do so explicitly.
>
> Format: six numbered answers, one substantive paragraph each. Each must declare a clear position (hold / refine / flip) before evidence. No need to write Igni code beyond short illustrative snippets — this is design critique. If you would push back on any of the recommended leans or the bundling rationale, do so explicitly with the alternative named and the cost stated.
