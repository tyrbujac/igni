# Igni Studio strategic critique — Stage 2-style panel

3-frontier-model strategic critique on the Igni Studio product concept (a hypothetical post-v1.0 commercialisation thesis Tyr wants pressure-tested before any of its assumptions calcify into v0.20+ design decisions). v0.19.1 cheatsheet attached as `--spec` system context — panel can rely on it as authoritative reference for what Igni *is*. Output is prose; `--no-grade`.

Models: `claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`. Budget ~$0.30. Outputs go to `tests/igni-studio-strategy/`. Synthesis happens after panel returns, in a separate Tyr-mediated session.

The 5 questions adapt the Stage 2 5-question framework from "is the design right?" to "is the strategic claim right?" using HOLD / REFINE / FLIP verdicts. Question 5 is the open-ended blind-spots question.

---

## 1. Igni Studio strategic critique

> You are critiquing a hypothetical product concept built on top of the Igni programming language. The Igni v0.19.1 cheatsheet has been provided to you as system context — you can rely on it as authoritative reference for what Igni *is*. The product concept follows. Read it carefully, then answer five questions in **HOLD / REFINE / FLIP** format with concrete evidence.
>
> **What Igni is, for context** (one paragraph): Igni is a UI-first programming language whose primitives match Figma's auto-layout vocabulary. It compiles to Flutter. Its design discipline is non-negotiable: indentation and colons replace braces; no parentheses on component invocation; no string interpolation; one way to do everything; the spec is a *budget*, not a backlog (every new keyword taxes LLM zero-shot learnability). v0.19 is the current shipped version. Path C — the commitment that Igni's primitives stay translatable from Figma's auto-layout vocabulary, with no escape hatches into raw Flutter — is the load-bearing scope decision. The canonical authoring workflow is "Figma → frontier LLM → Igni source → Flutter app", with the LLM reading the cheatsheet cold.
>
> **The product concept (Igni Studio):**
>
> Igni Studio combines three existing tools into one product: Figma's visual canvas, VS Code's text editing, and Claude Code's AI agent. Designers drag UI primitives onto a canvas; Igni source code generates in parallel; an AI agent edits both surfaces. A green-flag toggle switches between canvas-edit mode and live-preview mode (Scratch-inspired).
>
> The differentiation: most visual builders (FlutterFlow, Webflow, Bubble) generate code that engineers won't maintain or lock users into proprietary formats. Igni Studio's core commitment is **round-trip-capable editing** — designers edit visually, developers edit in VS Code, both work on the same `.igni` source files without conversion. This works because Igni's design discipline (one way to do everything, indentation-based syntax, no escape hatches) means the canvas and source have a 1:1 mapping. AST-based editing preserves comments and formatting.
>
> Files: standard project structure with `screens/`, `components/`, `tests/` folders, `theme.igni`, `shared.igni`, `igni.config` metadata, `AGENTS.md` for AI agent context. Studio works alongside VS Code; users can move between them freely. No proprietary formats, no lock-in.
>
> Target launch: post-June 2027, after Igni v1.0 dissertation defense.
>
> ---
>
> **Critique questions.** For each, give an explicit verdict (**HOLD** / **REFINE** / **FLIP**) followed by concrete evidence drawn from the Igni cheatsheet wherever possible. Vague "needs more thought" verdicts are useless. If a question's premise is wrong, name the wrong premise and propose the right question.
>
> **Q1 — Round-trip claim.** "Canvas and source have a 1:1 mapping because Igni has no escape hatches." Where does this break for real apps? Cite specific shapes from the cheatsheet that would resist round-trip (e.g., reactivity rules expressed in source-only patterns, conditional state, lambdas, `with` expressions, function bodies, test-scope verbs). What surfaces would Igni need to add to make the claim hold? If the claim already holds, name three real-app scenarios where it survives untouched.
>
> **Q2 — Four-panel framing.** Canvas + source + AI agent + live preview. Is anything missing from this product framing? Anything over-included? What would you propose as a concrete alternative if you'd flip the framing — e.g. drop one panel, add a fifth, change the green-flag-toggle metaphor.
>
> **Q3 — File structure scaling.** The proposed structure is `screens/` + `components/` + `tests/` + `theme.igni` + `shared.igni` + `igni.config` + `AGENTS.md`. Does this hold for a 50-screen, 3-developer team? Concrete failure modes you'd anticipate (e.g., `shared.igni` becoming a god-object — a known v0.17.0 meta-review concern in Igni; `screens/` flat-namespace collisions; AI-agent context-window saturation on `AGENTS.md`). Specific shape changes that would anticipate them.
>
> **Q4 — Differentiation honesty.** For each of FlutterFlow / Webflow / Bubble / Cursor / Lovable, in **one sentence per tool**: what specific Igni Studio claim is *defensibly* different (not "ours is cleaner") and what would competing tools likely close within 18 months of Studio's launch? Be honest — if the differentiation collapses against any of the five, name which and why.
>
> **Q5 — Most likely failure mode + 6-month signal.** Post-launch, what's the single most likely shape of failure (specific scenario, not a category)? What signal would catch it within the first 6 months — what metric, user behaviour, support-ticket pattern, or competitor move would tell you the failure-mode is materialising vs being avoided?
>
> Be substantive. Cite the cheatsheet directly when answering Q1 and Q3. Be willing to disagree with the framing.
