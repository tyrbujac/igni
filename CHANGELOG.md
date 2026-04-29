# Changelog

Spec evolution, one entry per version. Each version is a frozen snapshot in `spec/`.

---

## Unreleased
*Non-spec additions.*

- **`igni run` now hot-reloads on save (was hot-restart).** Editing and saving an `.igni` file now patches changed code while preserving widget state — counters, scroll position, form input, etc. all stay across saves. Press **R** in the terminal to fully restart when you need to reset state (e.g., after changing an initial value like `count = 0` to `count = 5`). Reverses the v0.5-era choice to default to hot restart for tutorial fidelity; the user-test session 2026-04-26 surfaced that hot-restart-by-default loses too much context during normal editing — the user's place in the app is wiped on every keystroke. Implementation: `transpiler/src/igni.ts:1379` flips success-path `'R'` to `'r'`. Error path (transpile failures swapping to the error screen) still uses hot restart for clean tree-shape transitions; comment at line 1387 explains why. Stdout marker for the success path now reads "Reloaded (file)" instead of "Recompiled (file)" to match the new semantics. Localhost mode's SSE sidecar still forces a `location.reload()` on save — Flutter's web-server device doesn't natively push reload signals (issue #44974), so the SSE broadcast is what makes save-to-reload work at all there. So state preservation is a chrome-mode property only; localhost mode (Safari/Firefox/Arc) still resets on save. Tutorial v2.7 updated: section 2 Part 3 + section 3 Parts 1 and 2 now include explicit "press R" hints where steps change initial values.
- **Tutorial v2.10 — Tier 1 + Tier 2 patches from 4-model panel review.** Six structural improvements driven by `docs/private/105_tutorial_panel_review.md`. (1) Reactivity rule named explicitly in Section 4 Part 1 — the language's core idea no longer left to inference. (2) "About saving" upfront blockquote consolidates hot-reload + manual-R guidance into one source of truth; redundant inline parentheticals trimmed from sections 2 and 3 (Option B-clean: hot-reload-on-save kept). (3) Expanded "If something goes wrong" callout with sample error output and four common causes (covers indentation/`:`/spelling/`=` vs `is`). (4) New "What you now know" concept-grouped recap before the existing syntax table (renamed to "Syntax reference"). (5) Section 1 Part 3 names the implicit `layout vertical` default so Section 4 doesn't feel like layouts arrive late. (6) Section 6 Part 2 explains *why* functions have `()` (mutable recipes vs. boxes) and *why* they go at the bottom (visual screen shape: state → layout → behaviour). Surfaced via `docs/private/105_tutorial_panel_review.md` (8.25/10 average → projected ~9/10 with these patches).
- **Tutorial v2.8 — opener uses cwd-mode flow + "coming back later" note.** Replaces single-line `igni new learn-igni` with three-step `mkdir learn-igni / cd learn-igni / igni new`. Trade-off: one extra command up front, in exchange for teaching the `cd <project>` muscle that's needed for every subsequent session. Adds an explicit "Coming back later?" paragraph clarifying that `igni new` is one-time-only (refuses on re-run inside an existing project) and `igni run` is the right command for resuming. Removes the redundant `cd learn-igni && ...` from the Safari/Firefox/Arc note since the user is already inside the project folder by that point. Surfaced 2026-04-26 in tutorial walkthrough — the named-folder shape required teaching `cd` later anyway, so do it up front instead of leaving it implicit.
- **`igni new` redesigned: auto-runs after scaffold, accepts target keyword as positional, mirrors `igni run` parsing.** Four shapes: `igni new` (scaffold in cwd, run on Chrome); `igni new <target>` where `<target>` is `ios`/`android`/`macos`/`web` (cwd-mode + target); `igni new <name>` (creates `<name>/`, scaffolds inside, runs on Chrome); `igni new <name> <target>` (subfolder + target). Eliminates the `igni new <name> → cd <name> → igni run` three-step ceremony — a single command takes the user from a fresh terminal to a running app. App display name derives from the folder via existing `prettifyName()` logic (`learn-igni` → "Learn Igni"); `--name "Foo"` overrides if needed (previously rejected for `igni new`, now forwarded to `run()`). Edge case: project literally named `ios`/`android`/`macos`/`web` is unreachable via positional (escape with `--name "iOS App"` or via the folder route). Implementation: `transpiler/src/igni.ts` argv parser (extracted `isTargetKeyword` helper), `createNewProject` → `scaffoldThenRun` (cwd-mode calls `run()` directly; named-folder mode mkdir + spawnSync re-execs the binary in the new folder so it picks up the right module-level `cwd`), dispatch site, `printUsage`. Tutorial v2.6 updated to match (single-line `igni new learn-igni` opener instead of three commands). Surfaced 2026-04-26 during the tutorial dress-rehearsal session before mum's user-test: friction visible on the very first command the tutorial asked the user to type.
- **Automation principle codified** — `docs/private/104_automation_principle.md` + CLAUDE.md rule. The dissertation contribution is the human-mediated synthesis layer (cold-test convergence-counting, patch-vs-defer decisions, "honest no" detection); never automate that. Plumbing (file shuffling, request fan-out, output formatting, parallel execution) is fair game. Decision criterion: "would automating this make the dissertation methodology chapter weaker?" Yes → don't. The principle is the firewall against multi-agent-orchestration drift that would dilute the contribution. Surfaced 2026-04-26 in a Claude.ai meta-review of Igni's automation roadmap; codifying so it survives session boundaries.
- **Trap-journal as structured append-only log** — `docs/private/trap-journal.md` (special file: no integer prefix; append-only date-prefixed rows). Format: `<date> | <category> | <description> | → <route>`. Initial back-fill of 16 entries from recent sessions (4 today + 12 historical from memory + ROADMAP recent-shipped entries). Aggregate snapshot at the bottom of the file shows category distribution: `runtime` and `tooling` lean is the dominant signal, suggesting Igni's quality risks live in running programs and the tools that run them, not in spec design (zero `spec-design` entries). 5-min-per-entry discipline; revisit aggregate every 5 new entries. CLAUDE.md `docs/private/` rule updated to note the special-case exception.
- **Three Claude Code skill files** — `.claude/skills/spec-cycle/`, `.claude/skills/figma-translation/`, `.claude/skills/stage-2-review/`. Task-specific guidance loaded when the relevant intent surfaces. Spec-cycle covers the 9-stage cycle + threshold rules + skip-Stage-2 criteria. Figma-translation covers Path C auto-layout + Variables mapping + reject list. Stage-2-review covers the 5-question framework + convergence-counting + patches-queued-not-inlined pattern. Project-level (in `.claude/skills/`) so they're version-controlled with the methodology; `.gitignore` now exempts `.claude/skills/` while keeping other `.claude/` state ignored.
- **Cold-test runner — `--parallel` mode** (`tests/runner/cold-test.ts`). Cross-provider concurrent, within-provider sequential (rate-limit-safe; especially Gemini). 4-model panel typically hits 3 concurrent pipelines (anthropic + openai + google). Speeds iteration ~3-4× for design-review work. **Sequential mode remains the default** — canonical for ship-validation runs whose outputs get cited in dissertation methodology, since parallelism breaks request-completion ordering. Per the automation principle (just codified): this is plumbing, not judgement; speeds the cycle without changing what's measured. 87/87 transpiler tests + 58/58 smoke pass post-change.
- **Cheatsheet prune draft for v0.15.1 ready.** Cuts the v0.15.0 cheatsheet from 3,657 → 3,078 words (-579, -16%) while preserving every Tier-A passage from the v0.14.1 4-web-LLM review (Todo intro, lexical reactivity rule, why-doesn't-state-reset, Pomodonut wall-clock teaching, primitive tables, `bind:` rule, `{x with}`, `every`+`now()`, `body`-renders-one, hard-constraint quotables) and every v0.14.2 runtime-semantics pin. Cuts: dropped `Running It` section (tutorial covers); dropped `Comments` section (`#` is intuitive); dropped `bg = card; if selected: bg = brand` styling-values mini-example (redundant with abstract pattern above); dropped `Bottom-anchored CTA` from Arranging things (cookbook covers); restructured Styling section's 12-token list + card carve-out + design tokens + text styles into a 4-row token table; tightened prose throughout. First post-v0.11.5 prune (4 versions of word-count creep corrected). Draft lives at `docs/private/103_v0151_cheatsheet_prune.md` until v0.15.1 spec/codegen design ships, at which point it folds into `spec/v0.15.1-cheatsheet.md` alongside wider-spacing-tokens additions. Surfaced via `docs/private/102_claude_code_project_review.md` Top-5 highest-leverage improvements (#3) + ROADMAP Stream 3 cheatsheet word-count entry.
- **`igni run` no longer silent-exits on Flutter compile fail.** When Flutter dies before reaching `appReady` (or exits with non-zero), the close handler now flushes the buffered stderr, clears the spinner, prints a clear `✗ Flutter exited with errors` banner with exit code, and suggests `cd .igni && flutter run -d chrome` for the unfiltered diagnosis path plus the generated-Dart pointer (`.igni/lib/main.dart`). Pre-fix: spinner → silent exit; user assumed Igni was broken. Surfaced 2026-04-26 by pomodonut session (15+ min diagnosing what turned out to be a Flutter compile-fail being swallowed by the build spinner) and flagged in `docs/private/102` Top-5 improvement #4 ("new-user-fatal"). The saved-memory bypass (`flutter run` in `.igni/` dir) is now what the CLI itself prints. Implementation: `transpiler/src/igni.ts:1319` close-handler + `relative` import. Verification: 87/87 tests + 58/58 smoke pass; manual verification of the new banner is Tyr-side (sustained `igni run` is not viable in Claude Code sessions).
- **`npm run smoke` — flutter-analyze smoke harness.** Loops over all 58 examples in `transpiler/examples/`, transpiles each into the shared `test_app/.igni/` scaffold (kitchen-sink pubspec with audioplayers + http + geolocator), runs `flutter analyze --no-pub`, fails on any error (warnings/info tolerated per pre-registered fail-strictness). Closes the partial-test-execution gap surfaced 2026-04-26 by pomodonut: 3 of the 4 bugs caught that day were `flutter analyze`-detectable (audioplayers pubspec injection, detectBuiltin Every-block import gap; the horizontal-centring and integer-math bugs are runtime/visual and need a different harness tier). Verified 58/58 passing on first full run. Wallclock ~3-5 min. Per-pre-registration: scope = all 58 examples; fail-strictness = errors only; verification = build + run + verify in-session. Script: `transpiler/run-smoke.sh`. ROADMAP Stream 2 #1 updated to "partially-solved." Surfaced via `docs/private/102_claude_code_project_review.md` Top-5 highest-leverage improvement #1.

- **Micro reference** — `spec/archive/v0.8.0-micro.md`, ~650 words, syntax-only third context tier below the full spec (~9,700 words) and cheatsheet (~1,780 words). Not a spec version; same language as v0.8.0. Lets cold tests vary context size as an independent variable.
- **`igni run` works offline.** Passes `--no-web-resources-cdn` to `flutter run -d chrome` so CanvasKit + Flutter's default Roboto load from the local SDK instead of `gstatic.com`. Prompted by a tutorial attempt blanking out on a restricted network: the browser couldn't reach the CDN and Flutter Web never initialised. Establishes "Igni should work without wifi" as a transpiler/tooling principle. Design note: `docs/private/86_offline_and_localhost.md`.
- **Full offline parity via bundled fonts.** `--no-web-resources-cdn` covers Flutter's engine fetches but not CanvasKit's runtime font resolution; on a fresh tutorial app (no theme block) CanvasKit still fetched Roboto from `fonts.gstatic.com` because no Roboto was registered locally. Fixed by shipping seven OFL/Apache-2.0 TTFs with the transpiler (`assets/fonts/` at repo root) and scaffolding them into every generated app. Ship-what's-used: Roboto is always bundled (Material default, ~340KB); each of the six v0.12.1 curated theme tokens (`pacifico`, `inter`, `source_sans`, `merriweather`, `lora`, `fira_code`) is copied and registered in `pubspec.yaml` only when the app's `theme:` block references it. No-theme apps pay ~340KB; an all-six app pays ~7MB (Merriweather is a 4.6MB variable font with no GitHub static). Codegen emits plain `fontFamily: 'Pacifico'` strings instead of `GoogleFonts.pacifico().fontFamily`, and the `google_fonts` package is no longer a dependency. Closes the follow-up logged in `docs/private/86` and satisfies offline-first (`memory feedback_offline_first.md`) for both Flutter's default and v0.12.1's theme tokens. **`.igni/pubspec.yaml` is regenerated by the scaffold — any manual edits to it are overwritten** (was implicit before; font bundling made it more visible). Design note: `docs/private/87_offline_font_bundling.md`.
- **New `igni run localhost` command.** Runs Flutter in `-d web-server` mode, prints the served `http://localhost:PORT` URL, doesn't launch any browser. Lets you use Safari, Firefox, or Arc for the dev loop. Parser recognises `localhost` as a third web variant (`target='web' + webMode='serve'`); `deviceId` branches on the mode. Flutter's `web-server` device doesn't push reload signals to connected browsers (issue #44974), so on its own you'd have to Cmd-R after every save — the SSE sidecar below closes that gap.
- **SSE auto-refresh sidecar.** On `igni run localhost`, igni starts a Node `http` server-sent-events endpoint on a random free port and idempotently injects a `<script>` tag (wrapped in `<!-- IGNI_RELOAD -->` markers) into `.igni/web/index.html`. The script opens an `EventSource` and calls `location.reload()` on message. Broadcast fires when Flutter emits `Restarted application` on the existing `.igni` save → `R` (hot restart) pipeline — no change to hot-restart-over-hot-reload (still driven by the "what you wrote is what you see" pedagogical promise). Net effect: Safari/Firefox/Arc behave like Chrome on save. Marker-wrapping keeps fallback to `igni run` (Chrome) clean — stale injection is removed when re-running in Chrome mode.

---

## v0.20.0 — 2026-04-29 *(in progress — Workstream B implemented; Workstream A pending Session 6b)*
*Dark-mode propagation + wider spacing tokens + cheatsheet-lint tooling.*

- **Workstream B — wider spacing tokens (this session, 6a).** `gap:` / `padding:` / `rounded:` / `size:` properties now accept a `spacing/N` numeric scale (`spacing/1` through `spacing/8`, mapping to 4/8/12/16/20/24/32 px). Existing `small` / `medium` / `large` word tokens stay valid as semantic aliases (`small` ↔ `spacing/2`, `medium` ↔ `spacing/4`, `large` ↔ `spacing/6`). Stage 0 cold-test 3/3 cells canonical (greeting card prompt; all three cells reached for numeric `spacing/N` over word tokens for fine-grained typography spacing). Implementation: `transpiler/src/codegen-helpers.ts` `DESIGN_TOKENS` widened; `transpiler/src/lexer.ts` `scanIdentifier` extended to tokenise `spacing/<digit>+` as one identifier token (special-case for the spacing-token namespace; other slashes stay as division). 2 new positive fixtures (`spacing-numeric.igni`, `spacing-word.igni`); 131 → 133 tests, 80/85 → 82/87 smoke, all green.

- **Workstream A — dark-mode propagation *(Session 6b — pending).*** Theme block widening for structural sub-blocks (`theme: scaffold:` + `theme: appbar:` + `theme: text:` colour-token), `theme dark:` sibling block for variant pair, `shared.theme_mode` string enum (`"system" | "light" | "dark"`) for runtime variant selection, auto-fall-back rule for missing dark tokens, active-variant token resolution scoped to theme tokens, instant-snap rule (no `transition:` on top-level theme), generic-selector forward-compat for v0.21 a11y. Stage 2 panel ran 2026-04-29 with 1H/1R/1F split on Q1; Tyr Reading A absorption — 6 patches reshape `(b)` into `(a) ∪ (b)` per `docs/private/118` synthesis section. Stage 0 cold-test 9/9 cells canonical with 3 cheatsheet patches applied. Implementation defers to Session 6b.

- **Workstream C — `scripts/lint-spec-trio.ts` v1 (shipped Session 2, commit `037f685`).** Catches synthesis-to-cheatsheet drift at PR time by extracting ```igni fenced code blocks from the spec trio and running each through the canonical Lexer + Parser. Local-runnable via `npx tsx scripts/lint-spec-trio.ts`. Already in main; not new this session.

**Cycle cost so far:** $0.30 (Stage 2) + $0.83 (Stage 0) = $1.13. Stage 3 (Session 7) ~$0.50 estimate; total v0.20 cycle ≈ $1.63.

---

## v0.19.1 — 2026-04-28
*Docs-only iteration on top of v0.19.0. Cheatsheet pruned ~440 words via the per-minor-version chat-mode review pattern; CLAUDE.md tracked-open-questions cleaned up; trap-journal aggregate snapshot refreshed.*

Cycle path: chat-mode 4-cell cheatsheet review (`tests/v0.19.1-cheatsheet-review/`, $0, ~30 min wallclock — Gemini Flash + GPT 5.3 + Gemini 3.1 Pro + Opus 4.7) → Explore-agent spec/cheatsheet/micro drift audit (clean, no third synthesis-to-cheatsheet drift instance found) → manual prune. No transpiler change, no spec-vs-cheatsheet drift, no syntax change.

### Changed

- **Cheatsheet (`spec/v0.19.1-cheatsheet.md`) pruned ~440 words** (6982 → 6541; first hard prune since v0.11.5). Tier B (chat-mode 2/4 convergence): `border:` Selected-state pattern compressed (~150 words saved); `every`-on-revisit semantics pinned ("next tick is scheduled `<duration>` from the resume moment, not from the original schedule, not immediately"; top-level captures don't re-fire on revisit); `spring()` is a read-only animated mirror, not state — reassignment errors; equality reference-vs-structural promoted to a bolded callout in §Boolean logic with the `without(items, {id: 42})` worked-fail pinned. Tier C (chat-mode 1/4 specific): lexical-reactivity restatements deduped (canonical statement in §Reacting; back-references in §Async, §Components, §Recurrence); `mock fetch:` URL keys match resolved-string literally; `value_of()` on unset input returns the bound variable's initial value; `seen "string"` matches within a single primitive's text content (not across siblings); `transition: fade` reordering inside `each` is a no-op visually; `max_width: + fill: true` axis clarified along the parent layout's main axis; transitive-reach concrete example pinned (`every` with no readers = no-op for UI); branch-shape clarification under `transition:` (multi-child branches auto-wrap in Column-min); defensive `freeze_time:` recommendation for any test that renders a screen reading `now()`; component-events density compressed; snapshot subsection condensed; "What X doesn't do" enumerations + Figma `_`-flatten + version-tagged callouts trimmed throughout.
- **Spec (`spec/v0.19.1.md`)** — `every`-block §Lifecycle paragraph extended with the resume-moment-rescheduling rule + top-level-no-refire clarification. Otherwise identical to v0.19.0 plus the new delta paragraph.
- **`CLAUDE.md` tracked-open-questions list aggressive cleanup** (10 → 7 items). Closed `Animations and transitions` (shipped v0.19.0). Promoted `Theming and dark mode propagation` to ROADMAP Stream 3 (v0.20+ candidate; surfaced 2026-04-27 by Gemini-3-flash zero-shot Pomodoro reaching for runtime-derived `theme:`). Removed `Named slots` and `Submit modifier` (already in ROADMAP Ideas). Added `Init-vs-render phase visual blur` (chat-mode 1/4 GPT raise; methodology-grade observation, deferred until cold-test convergence). Each remaining item has an explicit deferred-until signal note.
- **Trap-journal aggregate snapshot refreshed (2026-04-28).** New 55-entry snapshot supersedes 2026-04-26's; 2026-04-26 snapshot preserved as historical record. Category deltas: methodology 4→15 (+11, dominant signal — cycle now reflecting on itself more), runtime 4→7 (+3 from BMI hand-translation), codegen 1→4 (+3 same source), doc-drift 2→4 (+2, both synthesis-to-cheatsheet drift instances confirming trap class), tooling 3→5 (+2), parser 2→3 (+1), spec-design 0→1 (**first instance**: dark-mode reach surfaced by Gemini-3-flash zero-shot). Dissertation-flavoured framing per Tyr lock #4: the previous snapshot's "spec has been getting it right" line no longer holds; "frontier LLMs miss bugs that non-technical users find" thesis extended to "fixtures convergent across panels miss canonical user shapes that real apps surface in minutes" (mum-tester + BMI hand-translation = two-of-two pattern).
- **`docs/tutorial.md`** — version stamp updated from "Targets Igni v0.15.1" to "Targets Igni v0.19.1 (syntax verified against current spec — covers basic primitives only; advanced features like component events, animation, and testing are not yet in this tutorial)".
- **`spec/v0.19.0`** archived; `spec/v0.19.1.{md,-cheatsheet.md,-micro.md}` shipped.

### Methodology

- **Per-minor-version chat-mode cheatsheet review pattern continues.** Fourth precedent (v0.14.1, v0.15.0, v0.17.0, v0.19.1). $0 cost; ~30 min wallclock. The drift audit established that this read-the-whole-document instrument complements rather than overlaps with Stage 2/3 panels (which probe specific design changes against specific cheatsheet sections). Cheatsheet word-count delta direction inverted (v0.14.2 ship grew the cheatsheet +149 words; v0.19.1 cuts -441 words) — first contraction since v0.11.5 (2026-04-26 → 2026-04-28).
- **Drift audit clean — no third synthesis-to-cheatsheet drift instance.** Explore-agent cross-referenced Appendix B + spec body + cheatsheet + micro. The two known drift instances from the v0.19 cycle (`width: spring(...)` not in language; unquoted ISO timestamps that don't lex) were already patched same-session in v0.19.0; the audit confirmed no third instance. The trap class is now a 2-of-2 confirmed pattern; tooling response (`scripts/lint-spec-trio.ts`) logged as a Stream 2 follow-up — not bundled with v0.19.1 to preserve docs-only purity.

### Test count / spec ship

- `npm test` 124/124 green (no transpiler change).
- `npm run smoke` 80/80 green.
- `spec/v0.19.0` archived; `spec/v0.19.1` shipped.
- SYNC markers regenerated.

---

## v0.19.0 — 2026-04-28
*Animation primitives + snapshot testing. Three new layout/builtin/test-scope surfaces, all token-only or declarative; cheatsheet patches all held under post-implementation cold-test panel.*

Cycle path: Stage 1 design (`docs/private/113`) → Stage 2 panel (`tests/v0.19-design-review/`, $0.27, **3/3 HOLD on all five locks** — Trigger A on Q2 spring-vs-duration did NOT fire) → Stage 0 cold-test (`tests/v0.19-stage0/`, $0.63, **9/9 strong-pass**) → 3-session implementation (`feat(v0.19): animation primitives` `aa9fb92` → `feat(v0.19): test-scope verbs` `25f5366` → `feat(v0.19): snapshot serializer` `239127e`; Trigger B 3-session cap NOT fired) → Stage 3 ship-validation (`tests/v0.19-stage3/`, $0.65, **12/12 cells canonical**, 4-frontier-model panel including flash-lite noise tier, all three mid-cycle cheatsheet patches held). Cumulative cycle cost: **$1.55**.

### Added

- **`transition: fade` / `transition: slide`** — layout modifier on conditional renders. Token-only (system-default duration; no per-call argument). Codegen wraps Flutter's `AnimatedSwitcher` keyed by branch identity (Q4d) so third-state assignments interrupt and restart toward the new branch. Compiler rejects `transition:` on layouts whose immediate child set doesn't change, with a cross-pointing error message: *"Use `spring(value)` for changing values; `transition:` only animates child replacement."*
- **`spring(value)`** — declarative value-animation builtin. Codegen wraps `TweenAnimationBuilder<double>` driven by a spring-curve. Consumed by `label` (v0.19 scope; layout-dimension animation deferred to v0.20+ per Q1 split + the `width: spring(...)` synthesis-to-cheatsheet drift logged 2026-04-28). OS reduced-motion collapses spring duration to zero (Q2-a11y patch). Per-row spring inside `each` is keyed by row identity, not list index (Q4a). Compiler rejects non-interpolatable types with the symmetric error: *"Use `transition: fade` on a conditional render instead."*
- **`snapshot "<name>"`** — test-scope verb capturing a deterministic text-tree representation of the rendered widget tree. Goldens live at `__snapshots__/<test-slug>__<snap-slug>.txt`; first run writes, subsequent runs compare. **`igni test --update-snapshots`** re-approves intentional changes. Q4c lock: snapshot captures the spring's *target* value (read from `Tween.end`), not whatever intermediate frame — deterministic-by-construction, no `pumpAndSettle()` required. Serializer captures node identity + branch/list structure + bound layout properties + transition / spring state (Q5-serializer scope).
- **`mock now: "<iso>"`** (ambient-scope) and **`freeze_time: "<iso>":`** (block-scope) — time-mock primitives for `now()`-derived UI in tests. `freeze_time:` block-extent is unambiguous (Q6 scoping lock). `mock every: advance` advances both the every-block scheduler and the frozen `now()` value forward together (Q4b two-clock lock).

### Changed

- **`value_of(<binding>)`** — widened from "input/toggle/slider's `bind:` value only" to "any test-scope-visible binding". Resolves a Stage 0-surfaced cheatsheet ambiguity (table-vs-example contradiction, panel split 2/3 vs 1/3). For a `spring()`-bound binding, returns the target value per Q4c.
- **`spec/v0.18.0.md`** + cheatsheet + micro archived to `spec/archive/`. New `spec/v0.19.0.{md,-cheatsheet.md,-micro.md}` shipped.
- **SYNC markers** regenerated across CLAUDE.md, README.md, ARCHITECTURE.md, GALLERY.md (version v0.18.0 → v0.19.0; total tests 118 → 124).

### Methodology

- **Trigger B did not fire.** Doc 113's pre-registered watch ("if implementing the animation runtime + snapshot infrastructure exceeds 3 sessions, ship v0.19.0 animation-only and split snapshot to v0.19.1") was active across the entire implementation phase. Sessions 1+2+3 each landed within their own focused session; the snapshot serializer (the largest framework subsystem of v0.19) shipped in Session 3 without overrunning. Cycle stayed in budget.
- **Q4c reversal validated empirically.** The snapshot-captures-target-value lock (Tyr's reversal at Stage 2 against panel 2/3 lean toward current-rendered-frame; the **third instance** of the principled-architectural-over-ergonomic-majority pattern catalogued in `docs/private/114`) held under Stage 3 panel: multiple cells explicitly cited "snapshot captures `Tween.end` / target value, no settle required" — the deterministic-by-construction framing landed verbatim across frontier and flash-lite tiers.
- **Synthesis-to-cheatsheet drift trap class.** v0.19 surfaced *two* instances of cheatsheet promises that exceeded language reality: (1) `width: spring(item.recency * 200)` on horizontal layouts (no numeric `width:` exists; Stage 0 panel propagated the shape because the cheatsheet promised it); (2) unquoted ISO timestamps `freeze_time: 2026-04-28T12:00:00Z` (the dash-separated parts don't lex). Both surfaced during implementation (Sessions 1 and 2 respectively), patched in the cheatsheet draft pre-Stage-3, validated as held at Stage 3. New trap class catalogued in `docs/private/trap-journal.md`; methodology improvement candidate (cheatsheet-vs-language linter) logged for Stream 2.
- **Pre-bump Stage 3 pattern.** Stage 3 ran against the cheatsheet draft (pre-bump) rather than the shipped cheatsheet. Reason: v0.19 already accumulated two synthesis-to-cheatsheet drift traps mid-implementation; pre-bump validation gives one more pass before the spec freezes. Strong-pass at Stage 3 means no v0.19.1 docs iteration is queued from this cycle's findings.
- **Spec-cycle skill update — Stage 0 → Implementation handoff.** New rule added: *"Fix Stage 0 teaching gaps before implementation; don't ship known teaching ambiguities and patch later."* Codified per the `value_of()` + `width: spring()` precedents. First read of the cheatsheet is when teaching either lands or fails.

### Patches deferred (not blocking ship; ROADMAP Stream 3)

- **Branch-shape clarification under `transition:`.** Stage 3 surfaced a 2/4 minor: gemini-pro + flash-lite used flat-sibling branches inside `else if:` / `else:` under `transition: fade`; opus + gpt wrapped in inner layouts. Both shapes survive codegen (multi-child branches auto-wrap in Column-min during AnimatedSwitcher emission); cheatsheet doesn't explicitly endorse either. Logged for v0.19.1 docs iteration if real-app friction surfaces.
- **Defensive `freeze_time:` recommendation on tests not directly asserting timestamp UI.** Stage 3 surfaced a 1/4 minor: gemini-pro skipped the wrap on a Test 1 that only asserted `value_of(displayed_steps)`. Test passes; the wrap is defensive-best-practice. Logged for v0.19.1 docs iteration.

### Test count / spec ship

- `npm test` 124/124 green (was 118 → 124; added 13 v0.19 fixtures: 4 transition+spring positives + 3 transition/spring negatives in Session 1; 3 mock-now/freeze-time/snapshot positives in Session 2; 3 snapshot real-codegen positives in Session 3 + regenerated profile.test/spike-counter.test/todo.test for the `_igniMockedNow` global).
- `npm run smoke` 80/80 pass `flutter analyze --no-pub`.
- `spec/v0.18.0` archived; `spec/v0.19.0` shipped.
- SYNC markers regenerated across CLAUDE.md, README.md, ARCHITECTURE.md, GALLERY.md.

---

## v0.18.0 — 2026-04-27

Testing infrastructure. Tests live in sibling `*.test.igni` files, `igni test` discovers them and runs `flutter test` on the bundled output. The surface was locked across a full design cycle: Stage 1 design note (`docs/private/112_v018_testing_infrastructure.md`), Stage 2 panel critique (`tests/v0.18-testing-design-review/`) — Trigger A fired (3/3 panel cells voted to split snapshot to v0.19; applied immediately), Stage 0 cold-test (`tests/v0.18.0-stage0/`) — soft-fail attempt 1 (3-way divergence on the function-test access path), patch + re-run attempt 2 strong-pass with 3/3 canonical on every prompt × every model.

### Added

- **`test "name":` blocks in `*.test.igni` siblings.** Top-level construct alongside screens/components. Body is a sequence of statements (render, event-sims, mocks, assertions). Per Q1 doc 112: unified test block, not separate `unit` / `widget` / `integration` markers.
- **`render <Screen>` / `render <Component>, arg: value`.** Mounts the target. The `shared.X: value` arg form pre-sets shared state before the screen builds. **`render` is the documented test-scope override that puts the rendered screen's internal functions in test scope** (Q13 doc 112; ratified post-Stage-0 after the function-test access-path divergence). Mirrors how `mock fetch:` is a documented test-scope override of production reactive-fetch semantics — bounded magic, source-visible at the call site.
- **Event-sim verbs** — `tap "<exact label>"`, `change <id>: <value>`, `submit <id>`, `toggle <id>`, `slide <id> to <value>`. Selectors don't need test IDs: buttons resolve by visible text, inputs/toggles/sliders resolve by their `bind:` variable name. All event-sims require a prior `render` (parse-time error otherwise; per Q3 doc 112).
- **`expect <bool-expression>` — single canonical form.** No matcher API (`.toBe(...)`), no `assert` alias. Predicate sub-forms `seen "<text>"` and `on <Screen>` parse without parens directly under `expect` / `expect not`. General expressions over rendered state work because `render` exposes the screen's internal state and functions in test scope: `expect items.length is 1`, `expect value_of(draft) is ""`, `expect total_with_tax(100, 0.2) is 120`.
- **Test-scope builtins.** `seen "<string>"` (rendered-content match), `value_of(<id>)` (bound-input value), `on <Screen>` (current-screen assertion), `requested("<url>")` (was the URL fetched), `request_count("<url>")` (how many times). Resolve only inside test bodies; using them outside is a parse-time error.
- **`mock fetch:` block.** URL → response map (or `error "<message>"`). Consulted on every `fetch()` call, including reactive re-fires. Mocks set up before `render` so the initial fetch hits them. Test-mode fetch codegen routes through `_igniHttpGet` wrapper instead of raw `http.get()`; missing mocks throw loudly so accidental real network calls don't pass silently.
- **`mock every:` block + `advance <duration>`.** Jumps simulated time forward; all active `every <interval>:` blocks fire `<duration> / <interval>` times. Real wall-clock time unaffected. Same whitelist as production `every` (16ms / 100ms / 500ms / 1s / 5s / 30s) plus `60s` for coarser fast-forwarding.
- **Sub-second `every` whitelist widening.** `16ms` / `100ms` / `500ms` added to the existing `1s` / `5s` / `30s` set (Q-D doc 112). Covers animation frames (60fps), scrubbers, fast UIs. Codegen now emits `Duration(milliseconds: <ms>)` uniformly. v0.17.1's "known-limitation" note in §Recurrence is closed.
- **`igni test` CLI.** Discovers `*.test.igni` siblings, transpiles bundle with testMode forced on, writes to `.igni/test/igni_test.dart`, runs `flutter test`. Exit code propagates. Doesn't require an `app.igni` entry — any combination of test+screen files bundles cleanly.

### Changed

- **`every` codegen emits milliseconds.** AST renamed `seconds` → `milliseconds`; `Duration(seconds: 1)` → `Duration(milliseconds: 1000)`. No source-level change for users; production `1s` still spelled `1s`. All five existing `every`-fixture `.expected.dart` files regenerated.
- **Bound TextField / Switch / Slider widgets gain `key: ValueKey("<bind>")` in production codegen.** Required for test selectors (`find.byKey`); incidentally helpful for hot-reload widget identity.

### Methodology

- **Patch-and-re-run resolves Stage 0 soft-fail.** Attempt 1's 3-way divergence on the function-test access path was a real design gap (the cheatsheet didn't resolve how tests access screen-internal functions). A single targeted cheatsheet patch (Option A: render-makes-function-reachable, framed as documented test-scope override) collapsed the divergence to 3/3 canonical on attempt 2. Validates the cycle's `Soft → patch teaching, re-run` rule empirically.
- **Trigger A (Watch-list) fired and was applied mid-Stage-2.** 3/3 panel cells converged on splitting snapshot to v0.19 paired with animation primitives; doc 112 patched immediately. The Watch-list mechanism caught a real scope creep before implementation.
- **Framework-shaped cycle adaptation.** Doc 112's "given screen Y, write tests for it" Stage 0 prompt framing (vs. "build an app using X") produced direct-comparison-quality signal across panels for framework-shaped infrastructure. Reproducible for any future framework-shaped cycle.

### Test count / spec ship

- `npm test` 112/112 green (was 108; +4 new test+source fixtures: spike-counter, todo, profile, every-subsecond).
- End-to-end verified via `flutter test` on three smoke fixtures: counter (render + tap + expect seen/not seen), todo (event-sim + state-var assertions), profile (mock fetch + reactive re-fetch + requested/request_count).
- `spec/v0.17.1.md` / `-cheatsheet.md` / `-micro.md` archived to `spec/archive/`.
- `spec/v0.18.0.md` / `-cheatsheet.md` / `-micro.md` shipped with new §Testing section.
- SYNC markers regenerated.

---

## v0.17.1 — 2026-04-27

Docs-only iteration. Six cheatsheet patches surfaced by the v0.17.0 meta-review panel (`tests/v0.17.0-meta-review/`), a 7-cell chat-mode rating + critique across web UIs (gemini 3.1 pro, opus 4.7, gpt 5.3, gemini 3 flash; both cheatsheet and full-spec passes for the three capable models, cheatsheet-only for GPT). 7/7 cells flagged testing as a v1.0 gap; 4/7 raised the shared-namespace flatness + cross-screen ban as a god-object failure mode at scale; the cheatsheet-vs-spec within-model deltas surfaced specific Appendix-D / Appendix-B smells the cheatsheet was abbreviating. The deeper architectural critiques are queued for ROADMAP / v0.18 milestone design; this version applies the small docs-only patches that don't need a syntax cycle.

### Changed

- **§Reacting to users** — added a "Common mistake" callout to the *Derived state needs a function* paragraph, with a side-by-side `# ❌ wrong` / `# ✅ right` example showing top-level `total = count * price` (captures, doesn't track) vs `total(): return count * price` (tracks). GPT 5.3 named the non-reactivity of top-level derivation as "the biggest one" footgun for readers coming from React / Vue / Svelte / Solid; the rule was already documented but the surprise still landed, so the example was promoted to a louder callout.
- **§Arranging things** — added explicit "Layout properties go on a single line — no `\` line-continuation" pin. Carries forward the v0.17.0 Stage 3 finding (flash-lite at noise tier reached for backslash-continuation; the language rejects it). Clarifies that long property lists factor into custom components, not text-formatting tricks.
- **§Recurrence — `Durations` paragraph** — known-limitation note on the `1s/5s/30s` whitelist is now louder. Names sub-second `every` as an animation-loop primitive + the test-runner's time-mock target, both of which require it; v0.18+ candidate. Replaces "planned for v0.15+" boilerplate with an honest "wait, no workaround documented today."
- **§Builtins (strings)** — added a "Case asymmetry" callout pinning that `contains()` is case-insensitive while `is` equality is case-sensitive. Documents the canonical case-insensitive equality pattern (`lower(a) is lower(b)`).
- **§Builtins (utility) + the `now()` follow-up paragraph** — `round(x, n)` is now flagged as a string-return *display* function with an explicit warning that `if elapsed >= round(60, 1)` typechecks but compares int-against-string and silently miscompares. Concrete fix-it: use `floor()` for integer math, or compare against the unrounded value. Opus's spec-pass surfaced this as a runtime footgun.
- **§Rules (reference)** — new bullet pinning the PascalCase-component / lowercase-function casing rule. Components are invoked without parens (`Avatar user.avatar, size: 80`); functions are called with parens (`greet("Tyr")`). Naming `myCard` (lowercase component) or `Greet` (capitalised function) is a parse-time error. Opus's spec-pass flagged this rule as missing from Appendix B despite being consistently followed by every example in the spec.
- **Appendix B (full spec)** — same casing rule pinned, with a citation pointing back to the v0.17.0 meta-review panel for traceability.
- **Micro reference** — opening sentence widened: "Lowercase = built-in primitive *or* user-defined function (called with parens); PascalCase = user-defined component (invoked without parens)." Previously distinguished only built-in vs user-defined; now also distinguishes user-side function vs component.

### Methodology

- **Three-precedent chat-mode-meta-review pattern.** v0.14.1 + v0.15.0 + v0.17.0 have now each produced sharper signal than parallel API panels — open-ended rating + "biggest things before v1.0" framing surfaces architectural critique that structured Stage 0/2/3 prompts don't. Promotion to a recurring stage in `docs/cycle.md` is queued as a separate methodology decision; this iteration codifies the *patch-list-flowing-from-meta-review* pattern at the implementation layer.
- **Cheatsheet-vs-spec within-model delta validated as a methodology instrument.** Opus's spec-pass surfaced six specific Appendix-content smells the cheatsheet pass missed; gemini-3-flash's bonus pair (added on the day) gave a third within-model delta that wasn't planned. Future meta-review panels should keep the dual-pass shape for at least one capable reasoner.

### Test count / spec ship

- No transpiler change. `npm test` 108/108 still green.
- `spec/v0.17.0.md` / `-cheatsheet.md` / `-micro.md` archived to `spec/archive/`.
- `spec/v0.17.1.md` / `-cheatsheet.md` / `-micro.md` shipped.
- SYNC markers regenerated.

---

## v0.17.0 — 2026-04-27

First Path C primitive shipped via the new methodology branch for *visual-chrome* primitives: three-prong promotion gate (Path C prior + peer-language survey + hand-translation validation) replaces the cold-test-only gate that systematically under-signals on decorative-and-substitutable visual chrome. Sequenced cycle: `border:` ships now, `shadow:` deferred to v0.18 with pre-registered watch-list triggers (`docs/private/111`).

### Added

- **`border:` layout property.** `border: thin` / `medium` / `thick` outlines a layout. Composes with `rounded:` (border follows the rounded corners) and `background:` (border draws on top of the fill — both can be set on the same layout). Pair with `color:` for an explicit theme token, or omit to use `subtle` (the default). Width vocabulary is cosmetic-not-spatial: pixel tokens fit padding/gap because spacing is geometry, but border thickness is visual emphasis — `thin/medium/thick` reads more naturally than numeric tokens. Numeric/pixel widths and inline hex on `color:` are rejected at codegen with fix-it messages. `border:` on `button` is also rejected — button is a styled primitive whose appearance comes from theme tokens, while `border:` is a layout property that composes with `rounded:`/`background:`/the layout's bounds. For an outlined button, wrap a `button` in a bordered layout (the canonical shape pinned in the cheatsheet, derived from 3/3 different workarounds in the v0.17 Stage 0 panel — see `tests/v0.17.0-stage0/`).

### Changed

- **Cheatsheet `### Border` subsection** added, with a two-helper selected-state pattern (width AND colour both shift on selection). The two-helper redundancy was the convergent unprompted shape from v0.17 Stage 0 (3/3 frontier models reached for it independently — single-helper teaching was under-determined). Inline comment in the example explains the redundancy: either alone is ambiguous (a thicker border could be hover state; a brand-coloured border could be a category marker).
- **Cheatsheet outlined-button pin.** `border:` is layout-only; the canonical shape for an outlined button is `layout vertical, rounded: medium, border: thin: button "X", on tap: ...`. The pin pre-empts future "just add border to button" proposals.
- **Micro reference** updated with one-line `border:` summary in the layout properties paragraph.
- **`validateButtonTap` renamed to `validateButtons`** in codegen (now does both no-tap rejection and v0.17 border-on-button rejection).

### Methodology

- **Visual-chrome-under-signals pattern** documented (`docs/private/111`, "Why this primitive earns v0.17 despite zero empirical pull"). Pressure-tested by Stage 2 framing-critique panel (`tests/v0.17.0-border-design-review/`) — 3/3 REFINE on every question, 5 patches applied: decorative-vs-semantic boundary as the load-bearing rule, three-prong protocol replaces two-prong, named primitive class shrunk (border + shadow + advanced radius are clean fits; gradient + blur partial; opacity + rotation + scale + animation curves removed because they fail the boundary), mechanism layered, scope narrowed to "cold-test under functional/spec-extrapolation prompts."
- **Two-failure-mode taxonomy** logged in trap journal (`docs/private/trap-journal.md` 2026-04-27 methodology entry): Stage 0 strong-passed cells can hide *under-taught patterns* (cheatsheet teaches A; panel converges unprompted on A+B — fix via cheatsheet patch) vs *stretched primitives* (3/3 produce different workarounds because the primitive is too narrow — fix via cheatsheet pin + watch for compounding signal). Different signal classes despite both passing the ship bar. Methodological contribution for the dissertation chapter.
- **Cycle cost so far:** $0.149 Stage 2 framing-critique + $0.348 Stage 0 + Stage 3 ahead. Cumulative $0.497 pre-Stage-3.

### Fixtures

- **+6 test fixtures.** 3 positive: `border-outlined-card.igni` (width-only, default colour), `border-selected-state.igni` (two-helper pattern), `border-full-feature.igni` (all three widths + explicit theme colour). 3 negative: `border-numeric-rejection.igni`, `border-hex-inline-rejection.igni`, `border-on-button-rejection.igni`. Test count 102 → 108 passing.

---

## v0.16.0 — 2026-04-27
*Adds explicit handler-parameter syntax for component events. Parents write `on submit(text):` to receive an emitted value, `on submit(_):` to discard it, or bare `on submit:` for value-less events. Static validation rejects mismatch between child's `emit` signature and parent's handler. Cumulative cycle cost: $0.58 across Stage 2 + Stage 0.*

- **`on X(name):` syntax for receiving emitted values.** When a child component emits a value (`emit submit text`), the parent's handler names the receiver in parens (`on submit(query): results = fetch("/api/search?q=" + query)`). The receiver name is the parent's choice — symmetric with `each item in items:` and lambda parameters. Replaces v0.5–v0.15.x's implicit binding (where the parent's body could reference the child's emit-arg name as if by closure), which was Shape B (magic) and the v0.15.0 meta-review flagged as the largest under-specified spec gap.
- **`on X(_):` for explicit discard.** When a child emits a value but the parent doesn't need it, write `on X(_):` — `_` is the universal "explicit unused" convention from Rust/Swift/Python/Kotlin. The locked rule (Tyr decision Q2-b) reverses the Stage 2 panel default (2/3 silent-drop) per principled-architectural over ergonomic-majority — same shape as the v0.15.0 Q1 reversal. Source-readability preserved: `on X:` means "no payload exists"; `on X(_):` means "payload exists, parent doesn't need it."
- **Static-validation errors on mismatch.** Three rules: (1) child emits a value, parent uses bare `on X:` → rejected with the fix-it message naming both `(name):` and `(_):` options; (2) child emits no value, parent uses `on X(name):` or `on X(_):` → rejected with "event '<name>' is payload-less; remove the '(<param>)' parameter"; (3) a single component emitting the same event sometimes with a value and sometimes without → compile-time error (already enforced by `collectEmits` since v0.5; surfaced in error-prevention rules now). Reserved events (`tap`, `change`, `touch`) stay payload-less; `on tap(coords):` is rejected at parse time.
- **Closure-over-loop-var preserved.** When a child emits no value, the parent's bare handler body still closes over the surrounding scope. Stage 0 P3 (`each alert: AlertRow alert, on delete: ...`) confirmed the pattern is still legal; 1/4 models reach for it, 3/4 prefer the named-parameter form (decoupled component design — methodology observation, not a defect).
- **Methodology — Stage 2 + Stage 0 clean run.** v0.16 cycle: Stage 2 design panel ($0.19, 3/3 STRONG PASS on Q1+Q3+Q4+Q5; one Q2 split surfaced and Tyr-decided); Stage 0 cold-test ($0.39, 12/12 cells produce valid code, 4/4 P1 + 4/4 P2 reach for `on X(name):` unprompted). Cumulative $0.58. Source: `tests/v0.16-event-payload-design-review/` + `tests/v0.16-event-payload-stage0/`. Synthesis: `docs/private/109` (gitignored).
- **Parser** — `parseEventHandler` extends to optionally consume `(IDENTIFIER)` after event name; `_` is recognised as a parser-level discard placeholder. `parseComponentInvocation` relaxed to allow `ComponentName on event:` directly (no comma needed when no positional precedes — supports the canonical `SearchBar on submit(text):` shape).
- **Codegen** — cross-component static validator at `genComponentInvocation` checks parent handler signature against child's emit signature (using the existing `collectEmits` helper). Closure parameter binding now uses the parent's chosen name (`(text)`) instead of the child's emit-arg name (was the Shape B antipattern). Mixed-shape rule already enforced by `collectEmits` from v0.5+.
- **AST** — `EventHandler.parameter?: string | null` added. `null`/`undefined` = bare; `"_"` = discard; else parent's chosen name.
- **9 new fixtures.** Positive (4): `on-handler-named` (single-value payload), `on-handler-bare` (closure pattern preserved), `on-handler-discard` (`(_)` form), `on-handler-object-payload` (multi-value via object packing). Negative (5): `on-handler-param-on-reserved-event` (parse-time), `on-handler-param-on-payloadless-emit` (static-validation), `on-handler-bare-on-payloaded-emit` (static-validation), `on-handler-mixed-shape-emit` (collectEmits-level), `on-handler-discard-on-payloadless-emit` (static-validation). Test count: 91 → 100.
- **Programmatically-generated `ding.wav`** — pomodonut's `play("ding.wav")` had no asset; ROADMAP Immediate item closed via a generated 800Hz→500Hz sine sweep over 0.3s with linear amplitude fade-out. Mono 16-bit PCM, ~26KB. No external CC0 dependency.
- **Duplicate-theme error line attribution fixed.** `parser.ts` was passing combined-source coordinates through `formatTranspileError` during multi-file auto-discovery; the formatter now maps combined → per-file line numbers. ROADMAP Immediate item closed.
- **Spec/cheatsheet/micro all updated** with the new `on X(name):` rule + worked examples + closure-pattern preservation note. v0.15.2 archived to `spec/archive/`. SYNC markers regenerated.

---

## v0.15.2 — 2026-04-27
*Adds Appendix D pinning runtime semantics for ~14 cases the spec was previously silent on. Driven by a 4-model prediction-test panel ($0.28). Docs-only iteration: no syntax change, no transpiler change.*

- **Appendix D — Runtime semantics**, 14 sections covering equality (`is` structural for primitives, reference for lists/objects), block scoping (declare-at-top discipline), init-vs-render boundary, null on chained access (propagates null; canonical pattern is conditional gating, not defensive guards), iteration (lists only; no `each` over strings or numbers), reactivity reach (transitive lexical reads — re-render only fires when something reads the variable, directly or via function calls), function/component re-evaluation in render (no memoization), in-flight `fetch` on dependency change (latest-binds; prior in-flight results dropped), `fetch` inside `every` (skip-when-busy), numeric types after arithmetic (`/` is float, `floor()` for integer division, `round()` returns string for display), `bind:` target rules (plain identifier or `shared.X` only), `shared:` namespace across files (merge by default, build-time error on name collision), `fetch` on non-JSON / 204 (binds to error state).
- **Methodology — prediction-test panel.** New cycle stage debuted for v0.15.2: 4-model panel asked to predict runtime behaviour from the cheatsheet alone, with explicit `[GUESS]` / `[CANNOT PREDICT]` markers separating convergent fact from convergent guessing. Result classes: 5/14 strong (4/4 unmarked convergence — write down the rule), 2/14 strong-with-outlier, 7/14 splits (Tyr decision required). Continuous with Opus's meta-review Q4 #8 proposal (`docs/private/107`). The marker convention is what distinguishes "convergent fact" from "convergent guessing"; without it, equality and reactivity-reach would both have looked 4/4 strong, but reactivity is genuinely 2v2 split. Total cost $0.28 across 4 cells. Source: `tests/v0.15.2-runtime-semantics-test/`. Synthesis + 8 decisions (3 with Tyr-refinements): `docs/private/108`.
- **Cheatsheet pins** — five surgical inserts into existing sections: chained-null-propagation rule in §Reacting to users (replaces brief out-of-bounds line); transitive-reactivity edge-case clarification in §Reacting to users (closes the no-read-no-render question that split the panel 2v2); declare-at-top rule in §Functions; `fetch`-inside-`every` skip-when-busy paragraph in §Recurrence; multi-file `shared:` namespace + collision-error rule in §Shared State.
- **Spec opening discipline (continued from v0.15.0 patch)** — v0.15.2.md inherits the one-sentence delta + CHANGELOG-pointer shape established by the v0.15.0 meta-review fix. No "Changes from..." narrative paragraph at the top of the spec. CLAUDE.md rule 1 ("teach the language first; don't open with release notes") holds.
- **No transpiler / fixture / test change.** All 90/90 transpiler tests + 58/58 smoke continue to pass (no code path touched). The runtime-semantics rules document existing transpiler/runtime behaviour or pin a deliberate spec choice; future versions may add fixtures (e.g. block-scoping rejection at parse time, slow-fetch-skip behaviour) when the relevant code-path lands.
- **Decisions made (3 Tyr refinements over Claude defaults).** (a) Null on chained access: propagate-null + cheatsheet-teaches-conditional-gating, over Claude rec of crash-with-error — out-of-bounds is a foreseeable runtime state, not a structural bug; defensive guards at every access would create friction Igni doesn't currently have. (b) Reactivity reach: explicit "transitive" framing (function-call chains count as reads) over a narrower "literal text occurrence" reading — matches v0.14.2 cheatsheet pin #4. (c) Shared namespace: merge across files by default, error only on name collision — over a plain "build-time error" wording that risked being read as "one shared block per project."

---

## v0.15.1 — 2026-04-26
*Transpiler hygiene + tutorial v2.12. Three Igni-level errors replace silent failures and Dart-level leaks surfaced by mum-tester round 2. No spec syntax changes.*

- **`align: right` / `align: left` rejected at parse time** with an RTL-bridge hint pointing at `end` / `start`. Previous behaviour: any unknown align value silently fell through to `MainAxisAlignment.start` (left), so `align: right` quietly aligned left. Mum's tutorial extension hit this. Fix: `codegen-helpers.ts:121` `resolveAlign` throws `TranspileError` with Figma-vocabulary bridge ("align takes start, center, or end (RTL-safe vocabulary). Got "right". Use "end" — in a left-to-right layout, "end" means right; in right-to-left, it means left.") for `right`/`left`; rejects all other unknown align values too. Path C designers translating Figma Auto Layout's `right`/`left` get the conceptual bridge inline. New negative fixture `examples-errors/align-unknown`.
- **Layout block opener missing `:` rejected at parse time** when the layout has indented content below it. Previous behaviour: `layout vertical, align: center` (no trailing colon) followed by indented children rendered as empty space — silent failure. v0.13's interactive empty-layout shape (`fill: true, on touch: play(...)` with no children) is preserved by peeking past the consumed newline: if next token is `Indent`, it's a forgot-the-colon error; if next is sibling/dedent/EOF, the empty layout is legal. Fix: `parser.ts:556` `parseLayout` else-branch raises `TranspileError`. New negative fixture `examples-errors/layout-no-colon`.
- **`int_var = (... / ...)` reassignment rejected at transpile time** with an Igni-level message pointing at `floor()`. Previous behaviour: `count = count / 2` (where `count = 0` is typed as Dart `int`) leaked Dart's "double can't be assigned to int" into the user-facing terminal — source compiled, runtime errored out. Mum's HELP.md (now `docs/private/mum-help-2026-04-26.md`) showed three rounds of this Dart-level error during her Counter extension. Fix: `codegen.ts:findFloatDivision` recursive scan over the RHS expression tree (BinaryExpr, FunctionCall, UnaryExpr, FieldAccess, IndexAccess); skips into `floor`/`ceil`/`round` arg lists since those collapse double → int. `checkIntDivideAssignment` is called from both `genStmt` Assignment case (function bodies, every-blocks) and `genOnPressed` Assignment branch (event handlers — different codegen path). `ScreenContext.stateVarTypes: Record<string, string>` populated alongside `stateVars` at all four declaration sites in `genScreen` (state, build-local, fetch, locate). Decision rationale captured in `docs/private/106_int_divide_igni_error.md` — Path A (keep `/` as float, surface trap) chosen over Path B (integer division when both int) because B would reverse v0.14.3's `floor()` ship within hours. New negative fixture `examples-errors/int-divide-assignment`.
- **Tutorial v2.12 — Sections 3 + 4 restructure** driven by mum-tester round 2. Section 3.1 reduces if/else demo from three R-presses to one (start with `if`-only + `name = "Robin"`, save, flip to `name = "Taylor"` + R, then add `else:` — no R needed since just-restarted). Section 3.2 threads Robin/Taylor continuity (replaces anonymous `age = 42` with `name = "Robin"` + `age = 42`), separates `>=` and `#` explanations (was `# >= means "18 or bigger"` teaching both at once; now `>=` lands in the bullet list above the code, `#` is introduced in a follow-up paragraph with its own minimal example), and applies the codified trailing-period rule (`!`/`?` keep their punctuation; imperatives stay as-is; declaratives get full stops — "You are an adult." / "You are a child."). Section 4 expands from 3 → 5 sub-sections matching mum's "do more one at a time" note: 4.1 button + count + label (no on-tap yet, button is static), 4.2 wire on-tap (reactivity rule moves here from old 4.1), 4.3 second button in horizontal row, 4.4 vertical wrapper + gap, 4.5 padding + align: center. Section 2.2 picks up a one-paragraph note on `/` returning a fractional number (lands at first arithmetic, ahead of Counter). Editing-mechanics line recommends 2 spaces explicitly. Syntax reference table picks up `floor(count / 2)` row. Surfaced via `docs/private/mum-help-2026-04-26.md` and trap journal entries 2026-04-26 (cli-ux × 7).
- **HELP.md archived** to `docs/private/mum-help-2026-04-26.md`. Mum's working file from round 2 testing — preserved as dissertation evidence of a real user hitting real friction (the Dart-error leak that drove the int/divide fix).
- **Test count: 87 → 90.** Three new negative fixtures (align-unknown, layout-no-colon, int-divide-assignment). All passing.
- **Methodology framing.** This round of work is the cycle running clean — mum's testing → bug surfaces → trap journal entry → tutorial revision + transpiler hygiene + design note + CHANGELOG entry. The cli-ux category now dominates the trap-journal aggregate (15 entries vs 4 runtime); the lean tells the dissertation story that quality risks live in user-facing surfaces (errors, tutorial pacing, friction) more than in the spec or runtime. Both rounds of mum-testing have surfaced bugs that 4-model frontier-LLM cold tests never caught, strengthening the "non-technical users find what models miss" thesis. See `docs/private/106` §"Methodology framing" + trap-journal aggregate.

---

## v0.15.0 — 2026-04-26
*Adds `theme: color:` overrides and user-defined colour tokens. Pairs with inline-hex rejection. First Path C ship — designs translate from Figma Variables, not redesign.*

- **`theme: color: <token>: "<hex>"`** — overrides any of the 12 built-in colour tokens (`brand`, `subtle`, `danger`, `green`, `red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`) or declares a new user-defined token. Token names are lower-case identifiers (letters, digits, underscores). For Figma files with nested groups (`brand/border/subtle`), flatten with `_` (`brand_border_subtle`). Built-in token resolution falls back to hardcoded defaults for un-overridden tokens; the override layer adds entries on top.
- **`brand` override propagates to MaterialApp seed.** `theme: color: brand: "#X"` updates the `ColorScheme.fromSeed(seedColor: ...)` in generated Dart, so all Material widgets pick up the new brand. Other token overrides flow through the per-component `_igniColorValue` resolver.
- **Inline hex codes rejected** outside `theme:` blocks. `color: "#FF0000"` and `background: "#1A1A1A"` are parse-time errors with a fix-it pointer at the canonical pattern: define a `theme: color:` token, then reference by name. Audit confirmed 0 inline-hex usages in `transpiler/examples/` before ship — same-cycle rejection had no cleanup cost.
- **Path C alignment.** First v0.15.x ship of the four-candidate sequence (`theme: color:` → wider spacing → `border:` → `shadow:`) per `docs/private/97`. The hand-translation gate ran in two phases — `docs/private/99` (Claude.ai-generated mock with 23 semantic tokens) and `docs/private/100` (real Figma file with 11 Variables across nested groups). Both confirmed: 12 fixed token names cannot accommodate real design system data. Q1 LOCKED at user-defined per `docs/private/98`.
- **Stage 2 design review** (`tests/v0.15.0-design-review/`, $0.3352, 3 frontier models). 3/3 convergence on Q1 (user-defined lock holds) + Q2 (reserved-name list insufficient as drafted) + Q3 (`_` flatten correct, alternatives all rejected) + Q4 (same-cycle rejection holds, no deprecation cycle) + Q5 (`card` semantics anomalous). 4 patches applied post-panel: (a) **hard-list reserved names** in spec — keywords + primitives + style tokens + forward-reserved (`gradient`, `shadow`, `border`, `radius`, `motion`, `elevation`, `transparent`); (b) **`card` semantics clarified** — overridable via `theme: color:` but stays background-only after override (custom user-defined tokens have no such restriction); (c) **`_` flatten promoted to "Rule"** with full normalisation guidance (lowercase, non-alphanum→`_`, collapse, reject collisions); (d) **hex tightened to `"#RRGGBB"` only** — `"#RGB"` shorthand parses as error per "one canonical syntax"; example doc 98 fixed (`subtle: "#999"` → `subtle: "#999999"` conceptually). One alpha-channel `"#RRGGBBAA"` candidate (1/3 signal, real Figma feature) logged to ROADMAP Stream 3 as v0.15.x. Synthesis: `tests/v0.15.0-design-review/README.md`.
- **Stage 0 + Stage 3 cold-tests STRONG PASS** (`tests/v0.15.0-stage0/` $0.27, 3 frontier × 3 prompts; `tests/v0.15.0-stage3/` $0.28, 4 models × 3 prompts). 9/9 + 12/12 transpile-clean. 3/3 + 4/4 canonical adoption on P1 (brand override) and P2 (multiple overrides + user-defined `success`/`danger_subtle`). 3/3 + 4/4 P3 no-over-declaration on the negative test. Methodology trap-journal: P3 prompt phrasing biased frontier models toward `subtle` over canonical `card` for "subtle background"; flash-lite alone reached for `card`. Reword for future re-runs. Synthesis: `docs/private/101_v0150_coldtest_synthesis.md`. Cumulative v0.15.0 cycle cost: $0.89.
- **Methodology — Q1 reversed by pushback.** First-draft of `docs/private/98` recommended replace-only (smaller spec change). Tyr pushed back on three grounds: (1) Path C requires vocabulary match, not compression; (2) "ship smaller, expand later" pattern doesn't apply when the structural argument is already known; (3) hand-translation gate is the empirical resolution. All three landed. Doc 98 reversed Q1 to user-defined; the empirical phases (99, 100) confirmed.
- **3 new transpiler fixtures.** Positive: `theme-color.igni` (override + user-defined + nested-flat naming). Negative: `inline-hex.igni` (the rejection test). One existing fixture updated: `theme-unknown-sub-block.expected.err` (error message refreshed for the v0.15.0 sub-block list).
- **Test count: 85 → 87.** All passing.
- **AST + parser extension.** New `ThemeColorToken` shape (`name`, `hex`); parser's `parseThemeColorSubBlock` accepts arbitrary lower-case identifiers and validates `"#RRGGBB"`/`"#RGB"` hex syntax. Built-in colour names remain reserved (the existing closed lexer whitelist applies for direct identifier use; user-defined names live in the same namespace but coexist).
- **Codegen extension.** `CodeGenerator.themeColors` is the per-program override map, populated from `program.theme.color` at build start. `genColorValue`, `genBackgroundValue`, and the runtime `_igniColorValue` / `_igniBackgroundValue` resolvers all consult it before falling back to the hardcoded `COLOR_MAP` defaults. `hexToDartColor` helper does `"#FF6B35"` → `const Color(0xFFFF6B35)`.
- **Open implementation question deferred.** Doc 98 lists future-reserved-word collisions on user-defined tokens (e.g. if v0.16 adds `gradient` and a user previously declared `theme: color: gradient: "#X"`). Mitigation: continue reserving Igni's keyword set; accept arbitrary lower-case-and-underscore identifiers otherwise. Refine if a real collision surfaces.
- **Spec budget impact: net +1 sub-path** (`theme.color.<token>`). No new keywords. Reuses `theme:` block grammar. Reject-pairing tightens the visible surface (one fewer way to specify colours via inline hex).

---

## v0.14.3 — 2026-04-26
*Adds `floor()` builtin. Fixes two transpiler bugs surfaced by the first runtime test of pomodonut.*

- **`floor(x)` builtin** — returns the largest integer ≤ x. Codegen: `(${arg}).floor()` (Dart's built-in). Needed because Igni's `/` is float division (mirrors JS / Python / most languages), so time-formatting code like `m = s / 60` produces `24.9833...` instead of `24`. Without `floor()`, `format_time(s)` cannot display correct MM:SS — `round(m, 0)` rounds to nearest, not down, so `format_time(1499)` rendered as `"25:00"` instead of `"24:59"`. Added to spec, cheatsheet, micro under §Builtins. Source-side use: `m = floor(s / 60)`.
- **Pomodonut updated** — `transpiler/examples/pomodonut.igni`'s `format_time(s)` now uses `floor(s / 60)` for the minute extraction. Display now ticks correctly each second across the full 25:00 → 0:00 range.
- **Two transpiler bugs fixed** *(both surfaced by the first manual `igni run` of pomodonut, never caught by `npm test` because that suite only validates Dart codegen, not scaffold or runtime)*:
  1. **Audioplayers pubspec injection.** The `audioplayers:` Flutter package was added to `.igni/pubspec.yaml` only when the user had files in an `audio/` folder, but `play("file")` in source emits `AudioPlayer()` references regardless. Apps using `play()` with no audio assets compile-failed on unresolved `AudioPlayer`/`AssetSource` symbols. Fix: extracted `injectDependencies(dart, pubspec)` to a pure function in `src/scaffold-deps.ts` (mirroring http/geolocator detection-from-codegen-import pattern), with a unit test in `scaffold-tests/dep-injection.test.ts` (new test suite, run by `npm test` alongside the diff-tests). Test count 84 → 85.
  2. **`detectBuiltin` Every-block coverage.** `detectBuiltin` (drives the program-level `import` emit) skipped `Every` blocks, while `detectBuiltinInScreen` (drives the per-screen `_audioPlayer` field init) didn't. Pomodonut's `play("ding.wav")` lives inside an `every 1s:` block, so the field initialiser was emitted but the matching audioplayers import wasn't — compile-fail with unresolved symbols. Fix: added `if (item.type === 'Every' && checkStmts(item.body)) return true;` to `detectBuiltin` to mirror `detectBuiltinInScreen`. Pomodonut.expected.dart regenerated. Same fix transitively covers any builtin that's used only inside an `every` block (`random()`, `print()`, etc.).
- **Cookbook entry added** — `docs/cookbook.md` "Centre a row of buttons inside a centred column." Surfaced 2026-04-26 in pomodonut browser-test: `align: center` on outer vertical doesn't centre nested horizontal's children (the row's box defaults to filling width, so children cluster at left). Rule: every centring layout level needs its own `align: center`.
- **Pomodonut source fix** — added `align: center` to the inner Start/Reset/Pause horizontal row so the visual is centred. Same trap surfaced in (cookbook).
- **ROADMAP Stream 3 candidate logged** — switching `layout horizontal:` codegen default from `mainAxisSize: max` to `min` so the centring trap stops happening. Single-app signal so far; needs design note + Stage-0 cold test before any change. v0.15+ candidate.
- **Methodology — first manual `igni run` of a real app surfaced four real bugs in two minutes.** This validates the new Stream 2 ROADMAP item ("npm test doesn't actually run apps"). The diff-test framework only checks Dart codegen output; scaffold logic (pubspec, asset sync, Flutter project lifecycle) and runtime correctness (display formatting, integer math, layout behaviour) are uncovered. The new `scaffold-tests/` suite is a starting point for #1; a `flutter analyze` smoke pass on every example would catch additional compile-level bugs without needing full Chrome runs.
- **Methodology — Stage 3 strong-pass doesn't imply runtime correctness.** v0.14 timer primitive's Stage 3 reached 12/12 but never ran any of the produced apps. The integer-math gap that broke `format_time` was undetectable from codegen alone. **Distinguishing rule for the methodology chapter: Stage 3 validates spec learnability; runtime correctness needs a separate browser-test pass per spec change.** Pre-registering "browser-test the canonical example after each Stage 3" closes this loop without making Stage 3 itself heavier.
- Test count stays 85 (84 diff + 1 scaffold). All passing.

---

## v0.14.2 — 2026-04-26
*Docs-only iteration. Pins eight Tier-A runtime semantics surfaced by the v0.14.1 cheatsheet review panel. No syntax changes, no transpiler changes.*

- **Eight runtime-semantics pins** added to cheatsheet + spec + micro:
  1. **`fetch()` reactivity** — explicit pin: `fetch(url)` re-runs whenever any variable in its arguments (URL, `method:`, `body:`) is reassigned. Same lexical-reactivity rule as the screen body. (Cheatsheet was silent; spec already had it.)
  2. **`input bind: shared.X` exception** — pulled from a parenthetical into a boxed rule with code example. The rule was already in the spec at v0.14.1 ship; the cheatsheet treatment was buried.
  3. **Derived state** — explicit pin: top-level assignments run *once*; `derived = base * 2` captures `base`'s initial value and does not track changes. Use a function for derived state.
  4. **Function-call reactivity tracking** — explicit pin: reactivity follows references through function calls. `label total()` re-evaluates when state read inside `total()` changes.
  5. **`emit` argument binding** — clarified positional-vs-named confusion: `emit X v` passes a single positional value; the parent picks the receiving binding name in its handler. Cheatsheet "named binding" wording was ambiguous.
  6. **`replace` / `without` multiplicity** — pinned to **all matches** (codegen behaviour). Spec at v0.14.1 said "first occurrence only" — this was a docs error, not codegen behaviour. Spec text corrected; cheatsheet/micro now state "all matches" explicitly. In the typical `each item in items: replace(items, item, ...)` loop, only one element matches by reference, so multiplicity rarely surfaces in practice.
  7. **Object equality with `is`** — explicit pin: structural for primitives (strings, numbers, booleans, null); reference for objects/lists (`{name: "a"} is {name: "a"}` is **false**). Use `find(items, i => i.id is target.id)` for field-based matching. (Spec at v0.14.1 had this rule; cheatsheet was silent in the boolean-logic section.)
  8. **Component re-evaluation** — explicit pin: components re-render whenever the parent screen re-evaluates. Not memoised by argument. To run expensive work only on argument change, lift to a function on the parent.
- **Six Tier-B prunes** (cheatsheet only): `on change:` programmatic-reassignment paragraph condensed to one sentence; `{x with}` "verbose form is still legal" hedge dropped (one canonical form); layout `fill:` / `max_width:` prose tightened ~30%; lists section regrouped with `# query` / `# transform` / `# mutation` comments inside the code block; recurrence Pomodonut example replaced with a 12-line Stopwatch (full Pomodoro app shape now lives in `transpiler/examples/pomodonut.igni`); rules-at-end section pruned of duplicates already covered earlier (reactivity rule, list-mutation rule, cross-screen rule, object-identity rule).
- **One spec correction.** `spec/v0.14.1.md` said `replace`/`without` operate on the first occurrence only — wrong against shipped codegen which iterates the whole list. Decision (per project convention): pin the codegen, fix the docs. Documenting otherwise would have required a transpiler patch + new fixtures + Stage 3 reverification, which is out of scope for a docs-only iteration.
- **Cheatsheet word count: 3,347 → 3,496 (+149).** Pins are denser than the prunes shaved. Net growth flagged for a future cheatsheet-prune-only iteration; still under the v0.14.1 review's "do not touch" passages (Todo intro, lexical-reactivity rule).
- **Methodology — Stage 0 cheatsheet cold-test skipped.** Pins document existing runtime behaviour, not new behaviour — there's no design choice to validate. The 4-web-LLM cheatsheet review (which produced these items) is the methodology that will catch regressions in future cycles. Per-minor-version chat-mode review now established as the canonical ongoing instrument for cheatsheet quality. Source: `tests/v0.14.1-cheatsheet-review/README.md`.
- **No transpiler changes.** Test count stays 84. `npm test` passes unchanged.

---

## v0.14.1 — 2026-04-26
*Widens `bind:` to accept `shared.X` directly on `slider`/`toggle`/`checkbox`/`dropdown`. Transpiler-only patch — no spec syntax addition.*

- **`bind: shared.X` widening** for `slider`, `toggle`, `checkbox`, `dropdown`. Parser accepts field access on `shared` as the bind target; codegen emits `shared.update(() { shared.X = value; })` instead of bare assignment so the SharedState ChangeNotifier fires and the app-root `ListenableBuilder` re-renders. Plain (non-shared) bind paths keep the existing `setState`-wrapped emit byte-identical, so every pre-v0.14.1 fixture is unchanged.
- **`input` is the exception.** `input bind: shared.X` is rejected at parse time with an error pointing at the canonical bridge pattern (`draft = shared.title` + `input bind: draft, on change: shared.title = draft`). Reason: `input` backs onto Flutter's `TextEditingController`, which needs a stable Dart identifier for its controller field — `_shared.titleController` isn't valid Dart. Zero models reached for `input bind: shared.X` in the v0.14.0 Pomodonut rerun (settings UIs use slider/toggle for typed values), so this scope cut is honest.
- **Each-loop field access (`bind: obj.field`) stays rejected.** Different codegen story (needs `replace()` auto-wiring); separate future widening when a real-app surfaces compounding signal. v0.11.4 4/6 hit on each-loop binds; v0.14.1 doesn't address that path.
- **Motivation:** 11/14 cumulative signal across three runs — v0.11.4 Stage 3 (4/6) + Pomodonut original (3/4 on slider/toggle bind: shared) + Pomodonut rerun against v0.14.0 (4/4 — every cell hit it). Strongest carry-forward gap in the backlog. The Pomodonut rerun confirmed the gap was the sole blocker for criterion-4 #2 close — every model used `every`/`now()` correctly and every model failed at `slider bind: shared.X` or `toggle bind: shared.X`.
- **6 new transpiler fixtures.** Positive: `bind-shared-slider`, `bind-shared-toggle`, `bind-shared-checkbox`, `bind-shared-dropdown` (each pairs a main screen with a settings screen using the shared state). Negative: `bind-input-shared` (rejection with the bridge-pattern hint), `bind-each-field` (rejection with the future-widening note). Test count 77 → 83.
- **Methodology — Stage 2 design review intentionally skipped.** v0.13 and v0.14 used Stage 2 for new spec syntax with genuine shape uncertainty. v0.14.1 has no shape uncertainty — the syntax is what 11/14 panel cells already produced; the only "alternative shape" is "document the workaround," which the 11/14 evidence already rejects. **Distinguishing rule for the methodology chapter: Stage 2 is for new-syntax shape choice; transpiler widenings of existing-syntax-already-being-produced don't need it.** Design note: `docs/private/96`. Stage 3 follows in the next commit.
- **`on change:` clarification kept from v0.14.0.** No additional patches.

---

## v0.14.0 — 2026-04-26
*Adds `every <duration>:` recurring-timer block at screen scope + non-reactive `now()` builtin. First time-based reactivity in Igni.*

- **`every <duration>:` block-opener at screen scope.** Body is statement-shaped (assignments, `if`/`else`, function calls, `return`, `navigate`) — distinct from `each`'s render-shaped body. Reassigning state inside the block triggers lexical reactivity and re-renders the screen. Multi-block per screen — each `every` block is independent (its own `Timer.periodic` instance, its own ticker, no inter-block ordering guarantees). Mounted-screen-only lifecycle: pauses on navigate-away, resumes on return, missed ticks NOT replayed. Codegen emits `Timer.periodic(const Duration(seconds: N), (_) { ... })` started in `initState` and cancelled in `dispose`; pulls in `dart:async`.
- **Duration token whitelist: `1s` / `5s` / `30s`.** Other tokens (`100ms`, `1m`, `2s`), numeric durations (`every 2:`, `every 1.5:`), bare keywords (`every second:`), and variable references (`every rate:`) are rejected at parse time with targeted errors pointing at the planned extension path. Same token-first commitment as `max_width: phone | tablet | desktop` — the whitelist *is* the spec; no escape hatch. Higher rates (`100ms` for animations) and additional tokens (`1m` for low-rate polling) are v0.15+ candidates promoted by demonstrated real-app demand.
- **`now()` builtin** — non-reactive read, returns integer seconds since 1970-01-01 UTC. Codegen emits `(DateTime.now().millisecondsSinceEpoch ~/ 1000)`. Captured timestamps live in regular state vars; for periodic re-reads, call `now()` from inside an `every <duration>:` block. No timezone awareness, no sub-second precision, no monotonic-clock distinction in v0.14.
- **`on change:` clarification.** Spec wording tightened: `on change:` fires on user-driven primitive change only. Programmatic reassignment of a bound variable (from a Reset button, from an `every` block updating tracked values, from any non-user-input source) re-renders via lexical reactivity but does NOT fire `on change:`. Current codegen already implements this correctly (Flutter's `onChanged` only fires on user-input); the patch is docs-only. Preserves the user-action-class boundary on `on X:` events that the new `every` block depends on.
- **Reactivity-class taxonomy now explicit.** Igni separates user-driven (`on tap:` / `on touch:` / `on change:`), async-one-shot (`fetch()` / `locate()`), and time-driven (`every <duration>:`) reactivity into distinct syntactic families. Future external-stream events (websockets, geolocation updates) will get their own family. Each class has its own learnability surface — frontier models read `on X:` as "user did something," not as "any async event," which is what makes the family scaling.
- **Composing `every` with `fetch()`.** Reassigning a fetched variable inside an `every` block re-runs the fetch via lexical reactivity — no new primitive needed. Canonical shape for periodic remote-data refresh: `data = fetch(url)` at top level + `every 30s: data = fetch(url)` inside the block. Stage 0 panel converged on this shape unanimously without explicit cheatsheet teaching, validating that lexical-reactivity-driven composition holds at the principles level.
- **8 new transpiler fixtures.** Positive: `every-clock`, `every-pomodonut`, `every-multi-block`, `now-builtin`. Negative: `every-numeric-duration` (rejects `every 2:`), `every-unsupported-duration` (rejects `every 100ms:`), `every-bare-keyword` (rejects `every second:`), `every-in-layout` (rejects `every` outside screen-body scope, with a v0.13-precedent targeted error pointing at the canonical placement). Test count 69 → 77.
- **Methodology — first cycle exercising panel↔architecture interaction in both directions.** Round 1 first draft recommended `on tick:` event handler. Round 2 architectural pushback caught a load-bearing intuition no panel surfaced (the user-action invariant on `on X:`); recommendation flipped to `every <duration>:` block-opener. Round 3 Stage 2 design review (3/3 panel) caught a silent semantic bug architectural reasoning had missed (canonical Pomodonut example silently broken on navigate-away with relative-decrement); patch bundled a `now()` builtin with v0.14 to teach absolute-timestamp as canonical. Round 4 Stage 0 9/9 adoption against the cheatsheet draft. Captures the corrected methodology claim: panels and architecture both contribute; neither alone is sufficient. Design note: `docs/private/95_v014_timer_primitive.md`. Stage 2 outputs at `tests/v0.14-design-review/`. Stage 0 outputs at `tests/v0.14-stage0/`.
- **Methodology trap captured.** Stage 0 ran with default `--grade` flag; 0/9 transpile = false signal because the transpiler hadn't shipped `every` yet. Future pre-implementation Stage 0 runs default `--no-grade`. The auto-grade flag has a class of failure modes ("auto-grade meaningless when feature isn't yet implemented") that documentation should pre-empt.

---

## v0.13.1 — 2026-04-25
*Docs-only patch tightening v0.13.0's `max_width:` prose against three convergent findings from a post-ship spec/cheatsheet teachability critique.*

- **Composition rule 4 wording.** Replaced "remaining space is redistributed proportionally among uncapped `fill: true` siblings" with "remaining space is redistributed equally among the remaining uncapped `fill: true` siblings", and added the parenthetical "(Igni has no flex-weight property — all `fill: true` siblings have weight 1)". The word "proportionally" implied flex-weights that don't exist in Igni; all three reviewers (GPT-5.5, Opus 4.7, Gemini 3.1 Pro) flagged it as a likely LLM-hallucination vector — a model could plausibly invent a `flex: 2` property to satisfy "proportionally". Tightening makes the equal-weight reality explicit.
- **`full` / `none` / `auto` rejection.** v0.13.0 explicitly rejected `full` but left `none` and `auto` as plausible CSS-trained guess-targets. Strengthened the spec prose ("There is no `full`, `none`, or `auto` token"), the cheatsheet ("no `full` / `none` / `auto` token"), and the micro ("no `full` / `none` / `auto` token") to plug all three. The spec line also adds "the three tokens above are exhaustive; omission is the fourth state" — Opus's recommended framing.
- **Cheatsheet second example.** Added a `fill: true, max_width: tablet` × uncapped `fill: true` sibling example below the existing MiCard card example. v0.13.0's cheatsheet compressed the entire composition rule 4 (the new behaviour reviewers said developers and LLMs would actually copy from) into a single sentence; the second example is the canonical pattern for "main content column + flexible sidebar." All three reviewers said add it.
- **No transpiler change, no language change.** Token set unchanged: `phone` / `tablet` / `desktop`, omission = uncapped. Code semantics identical to v0.13.0.
- **Methodology — first post-ship spec-critique run.** Distinct from the pre-implementation design-review run at `tests/v0.13-design-review/` (which read the design note before any code). This new shape (`tests/v0.13.0-spec-critique/`, $0.19, ~3 min wall-clock) reads the *shipped artifact* and asks for clarity gaps. Caught three actionable ambiguities before Stage 3 ran. Worth flagging in the dissertation methodology chapter as a candidate method-extension. Single-model raises (align: center ambiguity, horizontal-layout clarification, compile failure mode for numeric values, "no-op" wording in rule 3) logged in `docs/private/91_v0130_postship.md` for future consideration; not acted on now to keep attribution clean.

---

## v0.13.0 — 2026-04-25
*Adds `max_width:` as a layout property — token-only width cap motivated by the MiCard desktop dogfood gap.*

- **`max_width:` on layouts.** Three tokens: `phone` (480px) / `tablet` (768px) / `desktop` (1200px). Caps a layout's rendered width including padding and background (CSS `box-sizing: border-box`). **Omitting `max_width:` is the canonical form for an uncapped layout** — no `full` token. Composes with `fill: true` per five documented invariants (shrink-wrap-without-fill, parent-wider-than-cap, parent-narrower-than-cap, multi-fill-sibling redistribution, box-model). Codegen emits `ConstrainedBox(constraints: const BoxConstraints(maxWidth: <px>))` outside the existing `Padding` + `Container` wrappers. New `MAX_WIDTH_TOKENS` table in `transpiler/src/codegen-helpers.ts` alongside `DESIGN_TOKENS`. Spelled with underscore (`max_width`) not hyphen because the lexer treats `-` as `TokenType.Minus` — same precedent as v0.12.1's font-token rename. Mi-card example updated to use `max_width: phone` on the contact-row cards (closes the original dogfood gap from `docs/private/77`). New `examples/max-width.igni` fixture exercises all five composition rules.
- **Token-only commitment.** Users cannot write `max_width: 540`. The token set is the spec; if a real app needs 540 specifically, the answer is "pick `phone` (480) or `tablet` (768) and accept the substitution." Variance-elimination is load-bearing for LLM accuracy; admitting numerics for "the 8% of cases tokens don't cover" reintroduces exactly the per-model variance Shape A would suffer from.
- **Methodology — Stage 0 deliberately skipped.** Igni's six prior token-based primitives (`style:`, `color:`, `gap:`, `padding:`, `align:`, `background:`) all showed near-100% adoption when introduced via cheatsheet update. Running Stage 0 on a seventh token-based primitive would confirm a prediction already held at p > 0.95 — methodological theatre, not measurement. **The skip itself is the methodology contribution: Stage 0 is for uncertainty, not ceremony.** Design note: `docs/private/79_v013_max_width.md`.
- **Pre-implementation design review** (instead of Stage 0). 3-frontier-model panel (GPT-5.5 high, Claude Opus 4.7 thinking=16k, Gemini 3.1 Pro thinking=16k) reviewed the design note before implementation. Total cost $0.31, ~3 min wall-clock. **Convergent finding (3/3): cut the originally-proposed `full` token** as a "one way to do everything" violation. Convergent finding (3/3): the `fill: true` × `max_width:` composition needed explicit spec text — five composition rules added to the design note and the v0.13.0 §Layout §Container width subsection. Run artifacts: `tests/v0.13-design-review/`. This is **not** Stage 0 (no measurement of LLM adoption) — it's a one-off external sanity check that caught a design slip the author missed. Citable as a method-extension contribution for the dissertation.
- **Stage 3 attribution plan.** Post-ship cold test will use a **desktop-layout-stress prompt** (multi-column dashboard or side-by-side two-panel UI explicitly targeted at desktop viewport dimensions). Pre-registered thresholds: 4/4 token adoption = ship holds; 3/4 = note the miss, decide between docs patch and let-it-ride; 2/4 or below = the Stage-0-skip was wrong, recalibrate the skip rule. Separate from any v0.12 typography Stage 3 to preserve attribution.

---

## v0.12.2 — 2026-04-24
*Docs-only restructure. Spec now reads top-to-bottom as a tutorial from basics to advanced.*

- **Changelog stack excised from spec top.** 36 lines of "Changes from v0.X" historical summaries removed; one-line v0.12.1→v0.12.2 delta remains; everything else lives here in CHANGELOG.md per the CLAUDE.md rule.
- **Section order rebuilt** around the reactivity rule as the central mental model. New order: Hello World → Todo walkthrough → Running It → Variables → Reactivity → Screens → Layout → Showing → Interactive → Events → Conditionals → Lists-basics → Functions → Components → Shared state → Navigation → Async → Lists-transformations → Styling → Theme block → reference sections → appendices (Property Applicability, Rules, Planned theme fields).
- **Lists split into basics + transformations.** Basics (§12): `each`, `+`, `without`, `replace` — the operations the Todo walkthrough uses. Transformations (§18, after Async): `map`/`filter`/`sorted`/`reversed`/`length`/`count`/object-update, with Lambda Expressions folded in as a subsection.
- **Variables section forward-refs stripped.** `user: User = fetch(...)`, `weather: Weather = null`, `items: [Product] = []` replaced with non-forward-referencing examples; type hints moved to a subsection at the section's end.
- **Planned theme content moved to Appendix C.** `spacing:` / `color:` theme sub-blocks and `size` / `weight` / `color` inside text bundles stay visible but out of the main learning path; §Theme block keeps only the v0.12.1-live font-override syntax.
- **Five signposts added** — tokens pointer in §Showing Things; scope pointer in §Variables; handlers-accept-any-statement note in §Events (forward-ref to §Functions); transformations pointer in §Lists-basics; transformations forward-pointer at end of §Async.
- **Todo walkthrough imported into spec as §2** — same 17-line example the cheatsheet uses, verbatim. Becomes the concrete referent §Reactivity's rule quotes.
- **Boolean Logic folded into §Conditionals; Data Binding folded into §Interactive Things; Lambda Expressions folded into §Lists-transformations.** Three independent sections become three subsections at their natural use sites.
- **Components section** gets a one-sentence "repetition pain" opening bridge so the section reads as the answer to a felt problem, not an abstract tool.
- **Cheatsheet synced minimally** — `Reacting to users` moved up to immediately after the Todo walkthrough (mirroring spec's reactivity promotion). Cheatsheet `Lists` intentionally stays unified — cheatsheet is scan-oriented, spec is read-oriented; opposite decisions on the same tradeoff.
- **Methodology signal** — three LLM-panel rounds (critique of v0.12.1 spec → meta-panel on the proposed restructure → plan-review panel on the execution plan) produced 3/4–5/5 convergence on every change shipped. Cleanest readability-driven iteration in the project. Full writeup: `docs/private/85_v0122_readability_panel.md`.
- **No language changes, no syntax changes, no transpiler changes.** 60/60 diff tests continue passing byte-identically.

## v0.12.1 — 2026-04-23
*Font-token rename patch. Transpiler implementation ships with this version.*

- **Rename `source-sans` → `source_sans`, `fira-code` → `fira_code`** in the curated font bundle. The four already-single-word tokens (`pacifico`, `inter`, `merriweather`, `lora`) are unchanged. Surfaced during v0.12 transpiler catchup: the lexer treats `-` as `TokenType.Minus`, so `font: source-sans` would parse as subtraction rather than a single identifier. No other Igni token vocabulary uses hyphens — renaming matches existing discipline (`COLOR_MAP`, `STYLE_MAP`, `ALIGN_MAP`, `DESIGN_TOKENS` are all single-word or dotted). Design note: `docs/private/84_v0121_font_token_rename.md`.
- **Transpiler implementation of v0.12's `theme:` block lands with this version** — `Theme` token + keyword, `parseThemeBlock` / `parseThemeTextSubBlock` with strict rejection of non-live paths (`spacing:` / `color:` sub-blocks, `size:` / `weight:` / `color:` fields, unknown fonts, duplicate theme blocks), `FONT_MAP` helper, `buildTextTheme(theme?)` merging font families into `ThemeData.textTheme`, conditional `google_fonts: ^6.2.1` pubspec injection. 55 → 60 diff tests (2 positive + 3 negative theme fixtures); existing 55 remain byte-identical.
- **Process discipline** — v0.12 was the first spec ship to explicitly defer its transpiler to a follow-up session. This rename patch is the clean precedent for "spec ships partial → transpiler catchup surfaces amendments → spec patched rather than lexer bent." New `CLAUDE.md` pitfall bullet records the pattern.
- **No other surface changes** — the `theme:` block shape, curated bundle membership, and patch-not-replace semantics are unchanged from v0.12.

## v0.12 — 2026-04-22
*First syntax ship since v0.10. New `theme:` block, scoped narrowly to font overrides for this version. Routed through a Stage-0-driven scope pivot — originally-proposed per-label `font:` shape falsified, theme-level shape emerged as the independent-model convergence.*

- **`theme:` block** — top-level declarative, app-wide, merges across `.igni` files (same pattern as `shared:`). In v0.12, the only live override path is `theme.text.<token>.font:` — binds a curated font-token to the `heading` / `heading.small` / `body` / `caption` style roles. Omitted keys keep their hardcoded defaults (patch semantics, not replace). The surrounding `spacing:` / `color:` sub-blocks and the `size:` / `weight:` / `color:` fields inside `text:` bundles stay marked as planned in the spec — shown alongside the live syntax so readers can see the full design intent without the language surface expanding.
- **Font bundle (fixed in v0.12):** `pacifico` (script), `inter` / `source-sans` (sans), `merriweather` / `lora` (serif), `fira-code` (mono). Growth discipline: bundle expands only via a Stage 0 + panel-finding on a specific missing font. No user-registered fonts, no fallback chains, no per-label `font:` override — those are deferred to v0.14+ if real apps surface the need. Design note: `docs/private/81_theme_block.md` §Non-goals.
- **No per-label `font:` property.** Originally proposed as Shape A in `docs/private/78_v012_font.md`; falsified at Stage 0 (token form 0–1/4 across a 4-model panel, below the pre-registered 2/4 bar). Typography is theme-level only in v0.12.
- **Motivation** — the MiCard dogfood (`docs/private/77_micard_dogfood.md`) exposed that typography is the first real-app fidelity axis Igni couldn't express. Angela Yu's MiCard is defined by Pacifico (script) + Source Sans Pro; Igni v0.11.6 had no way to reach either.
- **Design process — Stage 0 falsification + scope pivot.** The original design note (doc 78) proposed a per-label `font: pacifico` token syntax. Pre-registered Stage 0 (`tests/v0.12-stage0/`) measured 0/4 immediate token-form reach. The unexpected finding: 2/4 frontier models (Opus 4.7 + Gemini 3.1 Pro) independently proposed theme-level font mapping in their commentary — a third shape neither candidate in doc 78 anticipated. Same magnitude signal as v0.7.1's `emit toggle` convergence. A follow-up design note (`docs/private/81_theme_block.md`, Shape I approved) resolved the scope pivot: fold font into the existing `text:` bundle at theme level. Stage 0 on the theme-block shape choice was skipped by design (six prior token primitives ≥95% adoption — a seventh would be methodology theatre, per `docs/private/79_v013_max_width.md` discipline).
- **Additional methodology signal** — 3/4 models refused to invent `font:` syntax on at least one prompt, citing the spec's "One way to do everything" rule. Honest-no is the dominant behaviour when the spec discipline is strong. Worth citing in the dissertation as evidence that rule-simplicity enforces itself in cold tests, independent of transpiler rejection machinery.
- **Stage 3 commitment** — typography-heavy prompt from `docs/private/78` §Stage 3 carries over, rubric shifts to grade theme-based adoption rather than per-label shape reach. Attribution discipline vs v0.13 `max-width:` desktop-layout prompt holds. Bars pre-registered in `docs/private/81` §Decision.
- **Docs updates beyond the spec body:** `spec/README.md`, `docs/README.md` — current-version references bumped. `docs/tutorial.md` retained at targets Igni v0.11.6 (tutorial version is decoupled from spec version and requires human-testing to retarget). SYNC-marker regions in `README.md` / `ARCHITECTURE.md` / `CLAUDE.md` regenerated by `scripts/sync-docs.ts` in a follow-up housekeeping session.
- **Transpiler implementation is not yet shipped with this spec bump.** v0.12's `theme:` parser + codegen + `google_fonts` pubspec wiring lands in a follow-up session (see `docs/private/81` §Appendix for the full ship scope). Existing 55 diff tests continue to pass — no regressions from the spec-level additions, since the transpiler is unchanged.

## v0.11.6 — 2026-04-22
*Cheatsheet-only clarification pass. Reactivity lifecycle explainer added after LLM-panel review flagged the "re-evaluates from the top" rule as the 3/4 convergence gap across README, cheatsheet, and tutorial (see `docs/private/73`).*

- **Reactivity clarifier added** to `spec/v0.11.6-cheatsheet.md` *Reacting to users* section. Three sentences using the "starts at / resets to" mnemonic, explaining why top-level assignments don't overwrite state on each re-evaluation: initialisation lines run once when the screen first opens; re-evaluation re-runs the rendering part with the variable's current value, not its initial one; the `= 0` line doesn't fire again until you leave the screen and come back.
- **Motivation** — `docs/private/64` (first LLM-panel review, 2026-04-22) flagged the reactivity rule as taught abstractly, 3/3 panelists. README was updated same day to add evidence. `docs/private/73` (second panel) re-hit the same gap 3/4 — models still asking "why doesn't `count = 0` reset state?" after reading README and cheatsheet. Closes the re-hit. Opus 4.7's three-sentence sketch used verbatim. **No language changes, no full-spec body changes, no transpiler changes.** 54/54 diff tests still pass.

## v0.11.5 — 2026-04-21
*Documentation-only hygiene pass. Cheatsheet prune + context-specific-callout migration into the full spec's reference sections.*

- **Cheatsheet** pruned from 2,931 → 2,536 words (target: 2,500). Four context-specific callouts migrated to the full spec's reference sections: reactive-fetch footgun (input case, v0.9.0); reactive-fetch footgun (`locate()` extension, v0.11.0); `Counting by field` prose callout (v0.11.3/v0.11.4 — the canonical `length(filter(list, predicate))` example stays inline); visual-defaults subsection (v0.6.x implementation detail). Cheatsheet keeps the foundational teaching path complete; context-specific material migrates to the full spec where it belongs.
- **Micro** pruned from 750 → 714 words (target: ~690). Two cuts: async `locate()` footgun line (compressed to drop the transpile-error reference) and the visual-defaults rule (removed — implementation detail, not a language rule). Rules-only constraint preserved; no primitive coverage dropped.
- **Full spec** gains a new *Visual defaults* subsection under *Colours and Styling* carrying the previously-cheatsheet-only defaults list (padding, input border, button width, scaffold background, SafeArea when no AppBar). Other migrated content (reactive-fetch footgun, Counting by field, trigger-variable pattern) was already present in the full spec — no duplication added.
- **Motivation** — three consecutive docs-only ships (v0.11.2 → v0.11.3 → v0.11.4) each added 60–100 words of callouts without pruning. Current cheatsheet is past any reasonable "small teaching surface" claim the dissertation leans on and inflates cold-test context cost across every future run. ROADMAP.md:121 process note established the prune-before-add cadence; v0.11.5 is the first execution. **No language changes, no transpiler changes.** 54/54 diff tests still pass (cheatsheet-level change, doesn't touch codegen).

## v0.11.4 — 2026-04-21
*Documentation-only. Sharpens the v0.11.3 `Counting by field` callout per a 4-model ship review.*

- **Cheatsheet line 260** narrowed to `# whole-value match only — no predicates` — 4/4 panel convergence that the prior "identity — see Counting by field" deferral is what a table-skimming model misses. Single clause, no pointer, no jargon.
- **Callout rearranged** to lead with the restriction (`count` doesn't accept a predicate), then the worked `length(filter(...))` example, then the framing sentence. 3/4 panel signal; matches "denial at first contact" for readers who skim.
- **Wording nit** fixed: "has no predicate form" became "doesn't accept a predicate" — Opus 4.7 caught that the prior phrasing could briefly read as "no way to count by predicate", which is false since `length(filter(...))` *is* the predicate form (just composed). Full spec's matching subsection also rearranged for alignment.
- **Rejected from the panel:** ChatGPT's proposed `# ❌ not supported\ncount(alerts, a => ...)` anti-example. Opus's pattern-completion argument and the project's "teach what is, not what isn't" ethos both favour no wrong-shape example. Ship-review writeup: `docs/private/66_v113_ship_review.md`.

## v0.11.3 — 2026-04-21
*Documentation-only. `length(filter(list, predicate))` is now the canonical idiom for field-based counting.*

- **Cheatsheet and full spec** — *Lists* / *Finding items and counting* sections now teach `length(filter(list, predicate))` as the canonical idiom for counting by a field value, with a worked `length(filter(alerts, a => a.level is "critical"))` example. Clarifies that `count(list, target)` matches by reference identity only.
- **Motivation** — v0.12 Stage 0 scope audit (`docs/private/65_v012_count_predicate.md` + `tests/v0.12-stage0/Audit_Summary.md`) caught 7/7 successful calls across 4 frontier models × 2 structurally distinct prompts. 3/7 invented broken `count(list, lambda)` shapes that transpile cleanly but produce silently-wrong runtime output (always-false identity comparisons).
- **Pre-registered Stage 3 validation** — 4 models × 2 prompts (Alert Dashboard + one fresh similar-structure prompt) against the v0.11.3 cheatsheet. Pass bar = 0 silently-wrong inventions of `count(list, lambda)` across the 8 calls. Any workaround shape counts as success. 1+ invention escalates to Shape A (polymorphic `count`) design work.
- **Transpiler rejection** for `count(list, lambda)` tracked separately, ships after Stage 3 resolves — keeps the docs-only effect falsifiable. Follows the v0.9.1 precedent.

## v0.10.0 — 2026-04-17
*Object update syntax — `{target with field: newval}` replaces the field-enumeration idiom.*

- **`{BASE with KEY: VALUE, ...}`** builds a new object with all of BASE's fields plus the overrides. The canonical "update one field on an object in a list" idiom is now `items = replace(items, target, {target with done: not target.done})` instead of enumerating every field by hand. Motivation: the pattern appeared in every mutation example in the repo (`transpiler/examples/contacts.igni`, `shopping.igni`, the spec's toggle/save examples) and v0.7.0 ship reviews flagged it as boilerplate. Design note: `docs/private/42_v10_object_update.md`.
- **BASE is a variable or dot-access chain.** `{target with ...}`, `{item.profile with ...}`, `{shared.cart with ...}` are legal; `{get_item() with ...}` (function call) and `{items[0] with ...}` (indexing) are rejected — bind the result to a local first. Narrow restriction by design: keeps the base obviously tied to a named object the reader can look up.
- **Shallow only.** `{target with profile.name: "X"}` is a parse error; nest explicitly: `{target with profile: {target.profile with name: "X"}}`. No path-access magic.
- **Braces required, no bare-infix.** `{target with done: true}` is legal; `target with done: true` (no braces) is not. Rationale: `{}` is Igni's single object-construction delimiter — keeping `with` inside braces preserves one-way-to-do-everything.
- **`with` is a reserved keyword.** Cannot be used as an identifier or field name. Repo-wide scan before ship showed zero existing occurrences.
- **Pre-ship cold-test validation.** `tests/v0.10/Object_Update_Syntax.md` ran a four-model syntax-proposal round: four distinct shapes, no majority convergence (Opus → spread, GPT → `{with}`, Gemini → bare infix `with`, Gemma → juxtaposition). `with`-keyword family had 2/3 frontier plurality. Design note's fallback rule fired — ship the principle-driven recommendation.
- **First new micro reference since v0.8.0.** `spec/archive/v0.10.0-micro.md` forks from v0.8.0 (v0.9.0 and v0.9.1 added no syntax, so the micro stayed at v0.8.0). v0.10 is the first syntactic addition since v0.8.0; micro bumped to match.
- Transpiler: new `ObjectUpdate` AST node, `with` keyword added to lexer, codegen emits Dart `{...base, 'k': v, ...}` map spread. `transpiler/examples/contacts.igni` and `shopping.igni` migrated to the new shape; new `object-update.igni` positive example and two negative examples pinned (non-Ident base, `with` as field name).

## v0.9.1 — 2026-04-17
*Documentation-only. Trigger-variable pattern now recommends `on tap:` on a button and explicitly flags the `on change:` pseudo-fix.*

- **Spec wording tightening** in *Async Data*. v0.9.0 recommended setting the trigger "from a button or `on change:` handler". The v0.9.0 Product Search cold test (`tests/v0.9.0/Product_Search.md`) showed 2/3 frontier models read `on change:` as equivalent to a button and wrote `on change: search = query` to copy the bound variable into the trigger — which fires every keystroke and preserves the exact per-keystroke fetch the v0.9.0 rule was designed to prevent. v0.9.1 drops `on change:` from the recommendation and adds a sentence explaining why it is not an escape hatch. No syntax or semantic changes; same transpiler.
- Detection widening (catching `on change: trigger = bound_var` where `trigger` feeds a `fetch` URL) is deferred to v0.10 with its own design note. v0.9.1 is a docs-only patch to stop the spec from teaching the evasion pattern while the detection question is still being scoped.

## v0.9.0 — 2026-04-16
*Reactive-fetch footgun becomes a parse-time error.*

- **`fetch` URL concatenated with an `input bind:` target is now a transpile error.** Writing `results = fetch("/api/search?q=" + query)` where `query` is bound to an `input` used to compile and silently spam the API on every keystroke. The transpiler now rejects it with a fix-it message pointing at the trigger-variable pattern.
- **Detection is narrow on purpose:** string concatenation (`+ BinaryExpr`) inside the URL, direct `Ident` reference to a `bind:` target, `input` primitive only. `toggle` / `slider` / `checkbox` / `dropdown` stay legal — those reassign on discrete user action, and fetch-on-change is the intended pattern.
- Motivation: violated the "no magic" non-negotiable. A per-keystroke HTTP call is the opposite of "visible cause in the source." Cold-LLM tests repeatedly surface this pattern. Promoting the v0.5-era prose guidance ("Always use a trigger variable") to enforced rule turns the spec into its own teacher. Decision doc: `docs/private/40_v09_async_footgun.md`.
- Implementation: new `validateAsyncReactivity` pass on `Program` runs after `validateEmitPlacement`, before codegen. No parser changes. Reuses existing `TranspileError`.
- Test coverage: `transpiler/examples-errors/async-footgun.igni` pins the exact pitfall; existing `examples/fetch-reactive.igni` (trigger-variable pattern) continues to transpile.

## v0.8.0 — 2026-04-15
*Component event channels: `emit <event>` inside components, `on <event>:` at the call site.*

- **`emit <event> [<arg>]`** declares a custom event channel inside a component, valid only as the action of an `on tap:` / `on touch:` / `on change:` handler. Standalone use is a parse error.
- **`on <event>:` at component invocation** wires a handler that runs in the parent screen scope (`weight = weight + 1` setStates correctly). Same vocabulary as `on tap:` on primitives — no new keyword for callers.
- **Reserved event names: `tap`, `change`, `touch`** can't be custom event names. Parse-time error names the conflict.
- **Event data:** `emit selected item` → parent `on selected: handle(item)` where `item` is a named binding inside the handler body. Component author picks the binding name; caller uses it.
- **Optional handlers:** parent without a handler attached for a given emit just no-ops, same as `button "X"` without `on tap:`.
- Motivation: 5/8 compounded signal from v0.7.0 BMI cold-test (2/4 model invention of `on_tap_handler` / `on decrease:` + 3/4 ship-review flags). The string-key dispatch workaround was verbose enough that half the frontier models reached past it. Decision doc: `docs/private/33_v08_event_handlers.md`.
- Codegen emits each unique `emit X` event in a component as an optional `void Function([dynamic <arg>])? onX` field on the StatelessWidget. Standalone-emit validation runs as a pre-codegen pass.

## v0.7.1 — 2026-04-15
*`upper(s)` and `lower(s)` string case builtins.*

- **`upper(string)` / `lower(string)`** — return new strings with every letter uppercased / lowercased. Motivation: v0.7.0 Alert Dashboard cold test produced the strongest single-feature signal in the project's history (8/8 compounded — 4/4 model output friction + 4/4 ship-review flags). Every frontier model hit the missing uppercase builtin on the same prompt; three invented around it, one honest-flagged the gap. Lets the data model keep natural lowercase keys (`"critical"`, `"warning"`, `"info"`) for branching/filtering while the UI converts at the render site. Non-breaking.
- Codegen maps to Dart's `toUpperCase()` / `toLowerCase()`. Five-line change.
- No other string case helpers. `capitalize`, `title_case`, `trim`, `split`, `replace` on strings have zero cold-test evidence and are explicitly not in v0.7.1.

## v0.7.0 — 2026-04-14
*Styling tokens become assignable values.*

- **Assignable styling values** — colour tokens (`brand`, `subtle`, `danger`, `green`, `red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`) can now be stored in variables, passed around, and reassigned using the normal conditional-assignment pattern. Motivation: the BMI cold-test sequence repeatedly showed both humans and frontier models reaching for `bg = card` / `status_color = green` as the natural way to express conditional styling.
- **`card` is now assignable too, but stays background-only** — `bg = card` then `layout vertical, background: bg:` is valid. `color: card` remains invalid by design. This keeps the semantic surface token distinction from v0.6.5 while removing duplicate-layout boilerplate for selection states and status cards.
- **Strings explicitly unchanged in v0.7.0** — string concatenation stays `+` only. Interpolation was analysed and parked for a later version rather than bundled into the same release. This keeps v0.7.0 to one real language feature.

## v0.6.11 — 2026-04-14
*`shape: circle` property on `button` for compact circular controls.*

- **`button "X", shape: circle`** — compact circular button sized to its content. Default `button` remains a rounded-rectangle full-width bar. Motivation: BMI cold test revealed no way to express the round +/- stepper controls from Angela's reference design — models fell back to ordinary rectangular buttons. One new property value (circle), no new primitive. Circular buttons skip the SizedBox full-width wrap so a row of them lays out as distinct tap targets. Non-breaking.
- Canonical pairing: `button "-", shape: circle, color: subtle, on tap: ...` for +/- steppers; `icon "play", on tap: ...` still the right pattern for raw-glyph icon buttons without a filled background.

## v0.6.10 — 2026-04-14
*Documentation-only. "Bottom-anchored actions" pattern added to the layout section.*

- **Bottom-anchored actions pattern** — documented how to use existing `fill: true` on content sections so a CTA button naturally sits at the bottom of the screen (common mobile form layout). No new syntax. Motivation: BMI cold tests across v0.6.7 and v0.6.8 showed 4/4 models produced shrink-wrapped layouts with the CALCULATE button floating mid-screen, even though Igni already supported the correct pattern. Discoverability fix.
- Matching one-liner example added to the cheatsheet.

## v0.6.9 — 2026-04-14
*`round(value, places)` builtin for number formatting.*

- **`round(value, places)`** — returns a string with `value` rounded to `places` decimals. Standard rounding, works on int and double. `round(bmi, 1)` → `"21.5"`. Motivation: 4/4 cold-test models across v0.6.7 and v0.6.8 produced raw-float BMI displays because there was no way to format a computed float. Opus flagged the gap explicitly in both test runs. Smallest possible addition to close the strongest remaining signal after colour-as-variable. Non-breaking.
- Codegen maps to Dart's `toStringAsFixed()`. Two-line change.

## v0.6.8 — 2026-04-14
*Breaking: `body` slot renders exactly one widget. Caller wraps multi-child content explicitly.*

- **`body` is a single-widget slot** (not a container) — the implicit Column wrapper around caller content is gone. Callers passing multiple children must use `layout vertical:` or `layout horizontal:`. Motivation: the BMI cold test (v0.6.7) showed the implicit wrapper both hid layout decisions from the caller and produced runtime crashes when `body` sat inside a horizontal layout. Making the slot a literal hole aligns with the "zero magic" principle and fixes the crash by construction.
- Transpiler now emits a clear error when a wrapper receives 2+ children.
- Migrated `wrapper.igni` example to the new form.
- Same transpiler bug fixes folded into v0.6.8 from BMI cold test work: multi-param `navigate to`, dynamic icon-name runtime lookup, `if/else` at component body root, binary expression parenthesisation, wrapper components with 2+ positional args, screen-root `Expanded` unwrap, scoped `CrossAxisAlignment.stretch`.

## v0.6.7 — 2026-04-14
*Documentation-only. `print()` builtin, updated Running It section.*

- **`print()` builtin** for console debugging — `print(value)` logs to browser console. No new syntax; documents existing transpiler behaviour.
- **Running It section updated** — describes `igni run` behaviour (build output, hot reload on save, `print()` for debugging).

## v0.6.6 — 2026-04-13
*Full spec reorganised into learning order. Background images.*

- **Full spec reorganised** to match cheatsheet learning order: hello world → screens → display → variables → interaction → events → layout → state → conditionals → lists → functions → components → navigation → shared state → async → reference
- Design principles moved to end as "Rules (reference)" section
- Built-in primitives split into "Showing Things" (display) and "Interactive Things" (input)
- **Background images** on layouts and screens (`background: "photo.png"`). Extends `background:` property — colour names unquoted, image filenames quoted. 4/4 Destini cold-test models attempted image backdrops.
- Cheatsheet updated with background image support

## v0.6.5 — 2026-04-13
*Five documentation clarifications from 4-model spec review, plus list indexing from Quizzler cold test.*

- `fill: true` is layout-only (not primitives)
- Multiple events on one element (`on tap:` + `on touch:` coexist)
- `card` clarified as background token, not a general colour
- `fill: true` siblings split equally
- Property applicability table
- List indexing (`items[0]`, `questions[index]`) — zero-based, null on out-of-bounds

## v0.6.4 — 2026-04-13
*Ten additions from rebuilding Angela Yu's Dicee and Xylophone Flutter projects.*

- Screen properties (`title:`, `background:`)
- `fill: true` on layouts (expand to fill remaining space)
- Extended colour names (`red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`)
- `background:` on screens and layouts
- Local image assets (`image "photo.png"` from `images/` folder)
- Type hints transpiler-supported (`name: Type = value`)
- `play("file.wav")` audio builtin with `audio/` folder convention
- Empty layout blocks (background + events, no children)
- `on touch:` event (fires on finger contact, vs `on tap:` on release)

## v0.6.3 — 2026-04-12
*Driven by first end-to-end cold-LLM test (Contacts app, 3 models) + human tutorial testing.*

- `toggle label:` — fix primitives table inconsistency (3/3 models wrote it, spec example already used it)
- `map(list, item => expr)` builtin — replaces verbose `each` rebuild pattern (3/3 model reviews)
- `contains` is case-insensitive — matches user expectations for search
- Float literals (`price = 9.99`) — surfaced by non-programmer tutorial testing
- `random(min, max)` — utility builtin for random integers

## v0.6.2 — 2026-04-12
*Documentation patch.*

- No language changes from v0.6.1
- Cheatsheet companion added

## v0.6.1 — 2026-04-12
*Developer experience additions from building a calculator.*

- Implicit vertical layout — screen/component bodies stack vertically by default
- Comparison operators (`>`, `<`, `>=`, `<=`)

## v0.6 — 2026-04-12
*First post-transpiler spec. Designed from building real apps.*

- Lambda expressions (`item => item.done`) for list builtins
- `filter`, `sorted`, `reversed` builtins
- `return` in functions
- `contains()` string builtin
- `and`/`or` boolean operators

## v0.5.1 — 2026-04-12
*Documentation patch from v0.5 Shopping cold test. Last spec before the transpiler.*

- `find` identity warning with counter-example
- `spread: true` as canonical boolean form
- Wrapper component terminology cross-reference
- `count`-for-quantity idiom
- No-arg component invocation clarification

## v0.5 — 2026-04-11
*Closes the cross-screen state gap from the Notes test.*

- `shared:` block for cross-screen state
- Wrapper components with `body` slot
- List builtins: `replace`, `find`, `count`, `length`
- `is in` / `is not in` operators
- Input-debounce common-pitfall callout

## v0.4.1 — 2026-04-11
*Documentation patch from v0.4 acceptance tests.*

- Single-screen multi-view pattern (with caveats)
- Icon button example
- Functions-as-expressions
- `image round:` vs `layout rounded:` distinction
- No-cross-screen-function-calls rule

## v0.4 — 2026-04-11
*First spec drafted from cold-LLM test data (Calculator, Todo, Weather).*

- Arithmetic operators (`+`, `-`, `*`, `/`)
- `is X` for arbitrary equality
- `null`
- `+` for lists, `without` for removal
- `each` in non-rendering contexts
- Functional list updates
- Comments (`#`)
- Cross-component function calls
- Reactive re-fetch example

## v0.3.2 — 2026-04-11
*Rename from Rocket to Igni. No language changes.*

## v0.3.1 — 2026-04-11
*Last version under the Rocket name.*

- Structurally-correct mutation example
- `icon` primitive
- Object literals
- No-interpolation rule
- Intrinsic-dimensions carve-out

## v0.3 — 2026-04-11
*First major expansion.*

- Async data (`fetch`)
- Mutations
- Screen-internal functions
- Lexical reactivity rule
- "Spec as budget" and "three commands to first pixel" principles

## v0.2 — 2026-04-11
*The original draft under the Rocket name.*
