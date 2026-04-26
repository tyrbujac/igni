# v0.15.0 `theme: color:` design review

Single prompt asking three frontier models (claude-opus-4-7, gpt-5.5, gemini-3.1-pro-preview) to critique the v0.15.0 `theme: color:` overrides design note for Igni. Run via `tests/runner/cold-test.ts` with `--no-spec --no-grade`. Outputs are prose, not Igni code.

This is Stage 2 in the spec-iteration cycle (`docs/cycle.md`) — pre-implementation design review. Treat the responses as input to a decision, not the decision itself.

## 1. v0.15.0 theme: color: design critique

> You are reviewing a design note for the Igni programming language ahead of v0.15.0 implementation. Igni is a UI-first language whose north star is "Flutter, without the bracket hell" — indentation and colons replace braces, no parentheses on component invocation, no string interpolation, one way to do everything. The language is designed for both human readability AND LLM accuracy: every alternative or alias is treated as a branch where an LLM can guess wrong.
>
> A few load-bearing design principles for context:
>
> - **Spec budget, not backlog**: every new keyword is a tax on zero-shot LLM learnability. Optimise for rule simplicity, not output verbosity.
> - **One way to do everything**: every alternative form is rejected on principle. If a feature has two valid syntaxes, one is dropped.
> - **No magic**: if something happens at runtime, the cause should be visible in source.
> - **Token-first**: tokens (`small`/`medium`/`large` for spacing, `phone`/`tablet`/`desktop` for `max_width:`, etc.) over arbitrary numeric values, to bound LLM variance.
> - **Indentation, no brackets**: block structure is whitespace + colons. No braces, no parentheses on component invocation, no inline conditionals.
>
> Existing styling surface in v0.14.3:
>
> - Colour tokens (12 fixed): `brand`, `subtle`, `danger`, `green`, `red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`. Plus `card` (background-only).
> - Used as: `label "Hi", color: brand`, `layout vertical, background: card`.
> - `theme:` block exists with one live sub-path: `theme: text: <token>: font:` (overrides per-token font from a curated 6-font bundle).
> - Appendix C of v0.14.3.md sketches planned `theme: color:` and `theme: spacing:` sub-blocks but they're not yet wired through.
> - Inline hex (`color: "#FF0000"`) is currently legal but undocumented; no examples use it.
>
> Project context — *Path C* (the strategic positioning underlying v0.15+):
>
> - Igni recently committed to "match Figma's vocabulary where it fits Igni's flow-layout model" — Figma Variables map to Igni's `theme:` block, Figma auto-layout maps to Igni's `layout vertical/horizontal`. Real Figma files routinely declare 30+ colour tokens (semantic palettes like `primary-50`–`900`, `accent-1`/`accent-2`/`accent-3`, `surface-elevated`, `text-muted`).
> - A hand-translation gate ran in two phases (mock + real Figma file) before this design note was locked. Phase 1 (mock) had 23 semantic colour tokens; phase 2 (real, partial) had 11 Variables across nested groups (`brand/border/subtle` was a 3-level path). Both confirmed: 12 fixed token names cannot accommodate real design system data.
> - This is the canonical Path C demo. v0.15.0 is the first ship that's supposed to *prove* the Figma → Igni vocabulary match.
>
> The design note follows. Read it carefully — it had a revision arc (first draft recommended replace-only with built-in tokens; user-defined was the locked outcome after pushback + hand-translation). After the note, five specific questions are asked.
>
> ---DESIGN NOTE START---
>
> # 98 — v0.15.0 design note: `theme: color:` overrides
>
> **Status:** Stage 1 (design draft) — all three open questions resolved + one new implementation question added. Q1 LOCKED at user-defined per `docs/private/99` mock translation findings (mock had 23 semantic colour tokens > Igni's 12; 8 had no equivalent). Confirmed by `docs/private/100` real-Figma phase-2 walkthrough. Q2 settled (defer dark mode). Q3 settled (audit ran: 0 inline-hex usages, same-cycle rejection).
>
> ## Why this is the next spec change
>
> Three converging signals:
>
> 1. **v0.14.1 cheatsheet review (Tier A — independent signal).** 4-web-LLM panel flagged colour customisation as a real gap. Brand colour overrides are the most common request.
> 2. **Path C alignment.** Figma Variables → Igni `theme:` mapping is the strongest leverage point of the Path C scope; brand colours → `theme: color:` (this note); type tokens → `theme: text:` (already shipped in v0.12.1).
> 3. **Appendix C in v0.14.3.md.** The shape is already sketched. v0.15.0 wires it through.
>
> ## Proposed shape
>
> ```igni
> theme:
>   color:
>     brand: "#6C5CE7"
>     subtle: "#999"
>     danger: "#E74C3C"
>     my_brand: "#0066CC"           # user-defined token
>     primary_700: "#1D4ED8"        # user-defined token
> ```
>
> Mirrors `theme: text:` exactly: `theme.color.<token>: "<hex>"`. Hex strings use `"#RRGGBB"` syntax.
>
> The 12 existing colour tokens (`brand`, `subtle`, `danger`, `green`, `red`, `blue`, `white`, `black`, `yellow`, `orange`, `purple`, `teal`) are all overridable via the same syntax. Plus `card` (background-only). Net-new tokens are declarations, not overrides.
>
> Source code that uses `color: brand` or `background: card` continues to work unchanged. Net-new tokens are referenced the same way: `color: my_brand`, `background: primary_700`.
>
> ## Codegen sketch
>
> Today: `color: brand` compiles to `Color(0xFFEB1555)` (hardcoded).
> After v0.15.0:
> - If `theme.color.brand` is set, codegen reads the override hex string and emits `Color(0xFF6C5CE7)` for that token everywhere.
> - If `color: my_brand` is referenced and `theme.color.my_brand` is declared, codegen emits the matching `Color(0xFFXXXXXX)`.
> - If `color: my_brnd` is referenced (typo) and not declared, parse-time error with fuzzy-match suggestion.
> - Tokens not in any source theme block: fall back to the 12 hardcoded defaults.
>
> Implementation cost: parser extension (recognise `theme: color: <token>: "<hex>"` with arbitrary lower-case identifier in `<token>` position), codegen lookup table that consults `program.theme.color` before emitting any colour-resolution. Estimated ~200–400 LOC.
>
> ## Reject list (paired transpiler change in v0.15.0)
>
> Per Path C scope, inline hex codes outside `theme:` should be rejected. Today nothing prevents `color: "#FF0000"` on a label — but this isn't a token-first design. Pair the v0.15.0 ship with a transpiler rejection:
>
> ```text
> Error: Inline hex colours are not supported. Use a token from theme: color: …
> or one of the 12 built-in tokens (brand, subtle, danger, green, red, blue,
> white, black, yellow, orange, purple, teal).
>    label "Hi", color: "#FF0000"
>                       ^^^^^^^^^
>    Suggested: define a theme: color: token:
>      theme:
>        color:
>          my_red: "#FF0000"
>    Then use color: my_red.
> ```
>
> Audit ran: 0 inline-hex usages in `transpiler/examples/`. Same-cycle rejection has no cleanup cost.
>
> ## Q1 (locked at user-defined): replace-only vs user-defined tokens
>
> **The Path C constraint is what locks the choice.** Real Figma files routinely declare 30+ colour tokens — semantic palettes like `primary-50` through `primary-900`, `accent-1`/`accent-2`/`accent-3`, `surface-elevated`, `text-muted`, `success-50` through `success-900`. Replace-only would confine them to 12 fixed names. That's not a vocabulary match; it's a vocabulary compression. Shipping replace-only as the canonical Path C demo would lose fidelity at the colour layer — the very file the demo is supposed to translate.
>
> **Why "ship smaller, expand later" doesn't apply.** That pattern works when signal arrives during the smaller ship to validate the next step. But here the signal already exists structurally — Figma Variables aren't capped at 12. Replace-only would ship knowing it'll need to be expanded.
>
> **Open implementation questions for user-defined:**
> - **Token-name lexical class.** Currently colour tokens are a closed lexer whitelist. v0.15.0 needs them to become arbitrary lower-case identifiers. Risk: collision with future reserved words. Mitigation: continue reserving `brand`/`subtle`/`danger`/etc. as special, accept any other lower-case identifier as a custom token.
> - **Nested-group flattening rule.** Real Figma files use deeper hierarchies than `brand/<token>` — `brand/border/subtle` is a 3-level path. Translation needs a deterministic rule. Recommendation: flatten with `_` separator (`brand_border_subtle`), preserves uniqueness, matches Figma's hierarchical intent. Alternatives (leaf-only, first-and-leaf) lose information or risk collisions.
> - **Empty-theme case.** If `theme: color:` is declared but empty, no error — just no overrides. Mirrors `theme: text:` empty-block behaviour.
> - **Reserved-name redefinition.** Is `theme: color: brand: "#X"` an "override" or a "redefinition"? Override — same name, new value, same semantics. Net-new tokens (`theme: color: my_brand: "#X"`) are declarations.
>
> ## Q2 (locked: defer): light/dark mode
>
> Cheatsheet review flagged dark-mode propagation 1/4 (Tier B). The shape would be `theme: dark: color: brand: "#X"` or similar — adds significant complexity (parallel theme tree + system-detection primitive + render-time switching). Defer to v0.16+. Light-only in v0.15.0.
>
> ## Q3 (locked: same cycle): inline-hex rejection
>
> Audit confirmed 0 inline-hex usages in existing examples. Same-cycle rejection has no cleanup cost. v0.15.0 ships `theme: color:` overrides AND inline-hex rejection together — coherent ship, one canonical way going forward.
>
> ## Stage 0 cold-test prep (pre-registered prompts)
>
> - **P1 — Brand override.** "Build a settings screen with a logout button. Use a custom brand colour `#FF6B35`." Pass: `theme: color: brand: "#FF6B35"` + `button "Logout", color: brand`.
> - **P2 — Multiple overrides + user-defined.** "Build a status dashboard with brand `#0066CC`, custom `success: #00AA00`, custom `danger_subtle: #FFEEEE`. Three labels in those colours." Pass: 3 entries in `theme: color:` block (one override + two user-defined), three labels each using a token.
> - **P3 — Existing token unchanged.** "Build a card with subtle background." Pass: no `theme:` block needed; uses default subtle. (Negative test — does the model unnecessarily declare a theme block?)
>
> Ship bar: 4/4 P1 + P2 (canonical adoption); 3/4 P3 (no over-declaration).
>
> ## Spec budget
>
> - **Adds:** one sub-path (`theme.color.<token>`). No new keywords. Reuses the `theme:` and existing colour-token vocabulary.
> - **Reject-pairing tightens:** one new transpile-time rejection (inline hex codes). Visible in error messages, not in the spec budget.
> - **Cheatsheet impact:** one new bullet in the Styling section (~15 words).
>
> ---DESIGN NOTE END---
>
> Critique the design across these five dimensions. Be direct — if something is wrong, say so; if a question is genuinely well-resolved, say that too.
>
> **Q1: Q1 lock at user-defined.** The note locks Q1 at user-defined based on hand-translation findings (23 mock tokens, 11 real-file tokens including a 3-level nested name). Is this the right call? Specifically: (a) does the structural argument (Figma Variables aren't capped at 12) actually preclude shipping replace-only first? (b) is there a "smaller user-defined" — say, allow user-defined but cap at 24 tokens — that would still be honest to Path C while reducing implementation cost? (c) does the LLM-learnability concern (open token namespace = more guessing surface for cold tests) outweigh the Path C alignment? Critique honestly.
>
> **Q2: Token-name lexical class — risks of opening the namespace.** The note proposes accepting any lower-case identifier as a custom colour token. What's the risk of future reserved-word collision? E.g., if v0.16 adds a `gradient` keyword, what happens to a user who declared `theme: color: gradient: "#X"` in v0.15? Is the proposed mitigation (reserve `brand`/`subtle`/`danger`/etc.; accept everything else) sufficient, or should the spec hard-list reserved names that custom tokens cannot use?
>
> **Q3: Nested-group flattening — `_` separator vs alternatives.** The note recommends flattening `brand/border/subtle` (Figma group path) → `brand_border_subtle` (Igni token). Is this the right rule? What about: (a) preserving the slash (`color: brand/border/subtle` as identifier with `/` in it — would require lexer change), (b) leaf-only (`color: subtle` — risks collision with `text/subtle`), (c) first-and-leaf (`color: brand_subtle`). What does the canonical "one way to do everything" rule prefer?
>
> **Q4: Inline-hex same-cycle rejection.** The note pairs `theme: color:` ship with the inline-hex rejection (same cycle). Audit confirmed 0 examples affected. Is bundling them in one cycle the right call, or is there a methodological argument for splitting (deprecation warning in v0.15.0, removal in v0.15.1)? Igni has historically not used deprecation cycles — does that policy hold here?
>
> **Q5: Blind spots — what's the design note missing?** Read the design note end-to-end and identify the most important question or risk it doesn't address. This is the open-ended one — not constrained to colour, not constrained to v0.15.0. Could be about Stage 0 prompt design, about interaction with `theme: text:` (already shipped), about `card`'s special background-only status, about how colour resolution interacts with the `if x: color: brand else: color: danger` conditional-styling pattern, or about something else entirely.
>
> Be specific. Cite concrete examples or code shapes. If a concern is hypothetical, say so. If you'd recommend a change to the design before implementation, name the change.
