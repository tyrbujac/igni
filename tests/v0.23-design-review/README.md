# v0.23 primitive-class strategic design review — synthesis

**Methodology label:** strategic-exploration panel (no Stage 1 design note exists yet — output of this panel is INPUT to the not-yet-drafted `docs/private/138_*.md`). Format mirrors `tests/v1-studio-design-review/`, not Stage 2.

**Run:** 2026-05-08, sequential, n=3.

| Cell | API | Effort/Tokens | Duration | Input | Output | Reasoning | Cost |
|---|---|---|---|---|---|---|---|
| `claude-opus-4-7` | Anthropic Messages (streaming) | max_tokens 16000 | 106 s | 25,970 | 5,587 | 0 | $0.27 |
| `gemini-3.1-pro-preview` | Google GenerativeAI | max_tokens 16000 | 51 s | 18,490 | 1,621 | n/a | $0.06 |
| `gpt-5.5` | OpenAI **Responses** (streaming) | reasoning **high** | 359 s | 17,363 | 17,315 | 12,948 | ~$0.55 (est.) |

**Total cost ≈ $0.88. Total wallclock ≈ 9 min sequential.**

> **Methodology trap surfaced and routed at run-time** — the runner's `OpenAIProvider` uses `chat.completions.create` with `reasoning_effort`. For gpt-5.5, that path consistently `Connection error`-ed on long generations (3/3 retries). The fix was a one-off `run-openai-responses.ts` using the **Responses API** with reasoning streaming. → ROADMAP-S2 (port the OpenAI provider in `tests/runner/providers/openai.ts` to Responses API for `gpt-5.*` reasoning models). Unrelated to v0.23 primitive-class work.

---

## TL;DR

**Q1 — Should `screen` and `layout` merge? 3/3 KEEP SEPARATE.**

**Q2/Q3 — Of the three primitive-class options:** 3/3 reject A, 3/3 reject C as written, 2/3 reject B (Claude permissive, Gemini + GPT reject). All three propose a fourth option, with strong convergent core and divergent surface.

**3/3 convergent patches (canonical patch threshold per spec-cycle):**

1. **Remove `on tap:` / `on touch:` from plain `layout` and from non-semantic primitives** (`label`, `image`, `icon`, `rectangle`-if-shipped). Tap is a semantic affordance; only semantic primitives should accept it. *This is the load-bearing finding of the panel.*
2. **Add `link` as a navigation primitive** (`<a>` / route-aware). Distinct from `button`. Required before v0.24 HTML transpile to avoid `<button onclick="navigateTo(...)">` anti-patterns.
3. **HTML transpile target argues for *more* semantic primitives, not fewer.** The "spec budget" rule pushes back on aliases, not on genuinely-semantically-distinct primitives. Adding `link`, future `dialog`, future `disclosure` is cheap; aliasing them with `button` or `layout` is expensive.

---

## Q1 — `screen` / `layout` merge

**Verdict: 3/3 KEEP SEPARATE.**

| Cell | Headline argument |
|---|---|
| Claude | `screen` is route-target / `layout` is flex-container — genuine semantic distinction. Real opportunity is *tightening divergence* (move `max_width:` off `screen`), not merging. |
| Gemini | **`screen` is the reactivity boundary.** Merging breaks "screen re-evaluates from the top" — there'd be no root anchor. `fill: true` is the "poison pill" — context-sensitive form. |
| GPT-5.5 | `screen` is route/lifecycle/chrome; `layout` is auto-layout container. **Tightens further:** make `screen` *less* layout-like — remove implicit vertical stacking, consider `max_width:` layout-only. |

**Convergent on the sub-questions:**
- **Q1a `max_width: phone`** — context-sensitive-form trap if merged. 3/3.
- **Q1b `fill: true`** — has no meaning at root; would be position-conditional legality. 3/3 say this alone rules out merge.
- **Q1c single-vs-multi-child** — no clean rule for a merged primitive; either horn (one-child wrapper / many-children implicit layout) costs spec budget without gain. 3/3.

**1/3 — methodology-grade observation (GPT only):** the current `screen` already behaves implicitly like a vertical layout (per cheatsheet "screen bodies stack vertically by default"). This is a v0.22 inconsistency. Fix is **not** to merge but to make `screen` *less* layout-like — strip the implicit stacking. This is below patch threshold but worth its own design note (`docs/private/138a` or a separate v0.24+ candidate).

---

## Q2 — Three options for handling visible non-button shapes and tappable elements

| | Claude | Gemini | GPT-5.5 |
|---|---|---|---|
| **Option A** (universal `on tap:` + rectangle) | **Reject** — a11y aliasing | **Reject** — "catastrophic aliasing"; LLMs guaranteed to generate `<span onclick>` | **Reject** — "wrong semantics too easy to spell"; HTML punishes harder |
| **Option B** (`role:` on layout) | Mostly solves; permits as escape-hatch | **Reject** — exact aliasing, hypothesis violation | **Reject** — `role:` is target-vocab leak; `role: card` is "especially suspicious" (visual pattern, not a11y role) |
| **Option C** (expand `button` vocab only) | **Reject** — insufficient, doesn't solve tappable-card need; `body:` slot bifurcates wrapper-component `body` | **Reject** — property sprawl, reinvents layout inside button | **Reject** — partial; `layout, on tap:` still legal so problem persists |

**Convergence:** 3/3 reject A, 3/3 reject C as written, 2/3 reject B as written. All three call for a fourth option.

---

## Convergent fourth-option core (3/3)

All three independently propose a "semantic interactivity" model:

1. `on tap:` legal **only** on semantic interactive primitives (`button`, `link`, input-family).
2. `layout`, `label`, `image`, `icon`, `rectangle` are **not tappable**.
3. `link` is added as a navigation primitive — distinct from `button`.
4. User components carry semantics via existing `emit` events, not by becoming tappable containers.

This core is the patch.

## Divergence on surface form

| Question | Claude | Gemini | GPT-5.5 | Vote |
|---|---|---|---|---|
| Add `card` as styled-non-interactive primitive | ✅ yes | ❌ (use `layout` + `background:`/`rounded:`/`padding:`) | ❌ (use `rectangle` for inert decoration; layout for styled containers) | 1/3 — log |
| Add `tappable` as named primitive | ✅ yes | ❌ | ❌ | 1/3 — log |
| Allow `button` to take a block body (no string arg) | ❌ — risks bifurcating wrapper-component `body` | ✅ yes (parse-time mutually exclusive with string-arg) | ✅ yes | 2/3 — **consider** |
| Add `rectangle` as inert primitive | ⚠️ uses `card` instead | silent | ✅ explicit | 1.5/3 — consider as inert-only |
| Remove `on tap:` from `layout` | ✅ | ✅ | ✅ | 3/3 — **patch** |

---

## Patch queue (per spec-cycle skill)

### 3/3 → patch (queue for `docs/private/138`)

- **P1: Remove `on tap:` and `on touch:` from `layout` and other non-semantic primitives.** Tap-bearing primitives are restricted to `button`, `link`, input-family, and user components that root on a semantic interactive primitive. v0.23 break (back-compat NOT required, per locked context).
- **P2: Add `link` as a navigation primitive.** Properties: target (a screen reference + args), styling consistent with `button`. Codegen: HTML `<a href>`, Flutter `Semantics(link: true) + Navigator.pushNamed`. Required before v0.24 HTML transpile.
- **P3: Reject Options A, B, C as written.** None ship.

### 2/3 → consider (Tyr decides at design-note time)

- **C1: Allow `button` to take a block body** (mutually exclusive with the string-arg form at parse time, per Gemini). Solves icon+text buttons, complex-content buttons. Risk Claude raised: bifurcates the existing wrapper-component `body` mechanism — same keyword two meanings. Mitigation candidate: rename to a different syntactic shape (e.g. block-body uses `button: <props>:` opening directly, no `body:` keyword) so the wrapper-component `body` is untouched.
- **C2: Add `rectangle` as an inert decorative primitive.** No `on tap:`, no children. Properties: `color`, `width`, `height`, `rounded`, `border`. Path C / Figma vocabulary aligned. GPT explicit, Gemini silent (neither rejected nor proposed), Claude proposed `card` instead.

### 1/3 → log only

- **L1: `card` + `tappable` as separate named primitives** (Claude only). Defended on flat-namespace LLM-legibility grounds. Below patch threshold but recorded.
- **L2: Tighten `screen` — remove implicit vertical stacking** (GPT only). Methodology-grade. v0.22 inconsistency surfaced; fix is to require an explicit root `layout vertical:` inside every `screen`. Candidate for its own design note (deferred — not v0.23 scope unless promoted).
- **L3: `role:` on `component` declarations** (Claude only, predicted-minority). User components could declare a11y role at definition site. Listed as v0.24 HTML-transpile blocker by Claude. Worth a separate Stream 3 entry; not v0.23.

---

## Honest-no / principled-minority detection

- **No model honestly-no'd.** All three engaged the question substantively, proposed concrete alternatives, and defended them.
- **Claude predicted a principled-minority reversal** (Q3e closing): "this isn't a primitive question, it's a `component` question — push `role:` to component declarations instead." Claude does **not** endorse the reversal, but flags it as serving a real gap (component a11y for v0.24 HTML transpile). Recorded as L3.
- **No false consensus.** The 3/3 on "remove `on tap:` from layout" came from three independent reasoning paths (a11y tree mismatch / catastrophic LLM hallucination / HTML semantic decoupling). Genuine convergence, not anchoring.

---

## Recommended next step

Draft `docs/private/138_v023_primitive_class.md` with:

1. P1 + P2 + P3 as the v0.23 ship plan (3/3 patches).
2. C1 + C2 as open sub-questions for Stage 2 panel (after the design note is written).
3. L2 (tighten `screen`) flagged for a separate design note — methodology-grade observation worth its own treatment, not bundled into v0.23 primitive-class.

**Sequencing flag:** `tests/v1-studio-design-review/` (pending synthesis) overlaps with this on the `role:` axis. Per the methodology framing in `prompts.md`, re-read this synthesis after the studio panel synthesises — if studio's Position (b) reaches a different conclusion on "should any primitive accept on tap?", the C1/C2 considerations may need re-weighting before v0.23 ships.

**Cost / signal note for dissertation methodology chapter:** GPT-5.5 with reasoning **high** generated 12,948 thinking tokens and 17,315 output tokens for one prompt — a substantively different shape from chat-mode panel responses. The reasoning-models-via-Responses-API path is now the canonical OpenAI integration; the chat-completions path failed deterministically on this prompt size + reasoning model combination. Trap-journal candidate: add an entry routing the OpenAI-provider port to ROADMAP-S2.
