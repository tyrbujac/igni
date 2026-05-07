# v0.22 size-token scale — Stage 0 cold-blind panel (gaps + names)

**Status:** Panel run complete (n=4, 2026-05-07). Synthesis below; v0.22 scope locked at `docs/private/137_studio_drift_size_token_gaps.md`.
**Method:** Chat-mode 4-frontier-model cold-blind panel. Anti-anchored via elision (token names replaced by `<token_A>` placeholders).
**Models:** Claude Opus 4.7 (Claude.ai), GPT-5.3 Pro (ChatGPT), Gemini 3.1 Pro (Google AI Studio), Gemini 3 Flash (noise-tier — operator added 4th cell).
**Cost:** $0 (chat-mode subscriptions). Operator-attention: ~2 hr (run + capture + synthesis).
**Outputs:** `claude-opus-4-7.md`, `gpt-5.3.md`, `gemini-3.1-pro.md`, `gemini-3-flash.md` (all verbatim).

## What this panel measured

Studio prototype audit (see `docs/private/137_studio_drift_size_token_gaps.md`) surfaced three apparent spec gaps: zero token (`padding: 0`-equivalent), max-rounded token (pill/circular corners), extension tokens (xs/xl beyond the 3-step word scale). Studio is n=1 self-evidence (Tyr authored both Igni and Studio); the cold panel was the independent second source.

The panel asked **two questions in one prompt**:
- **Gap-validation**: which proposed gaps are real?
- **Naming**: for whichever gaps are accepted, what should the new tokens be named?

Anti-anchored to BOTH the canonical scheme AND Studio's drift via elision — neither was disclosed until after the model proposed. Honest-no escape baked in.

## Methodology lineage

- **Stage 0 cold-blind pattern**: standard for spec-syntax design (`docs/cycle.md` §Stage 0; canonical example `docs/private/91`).
- **Chat-mode operator workflow**: clones `tests/v1-studio-design-review/` (2026-05-01) — first 4-cell strategic-critique chat-mode panel; same paste-shape but **different question shape** (cold-blind proposal vs HOLD/REFINE/FLIP). **First instance of chat-mode-Stage-0-cold-blind cold-proposal class** (see methodology addendum in doc 137).
- **Anti-anchoring discipline**: per `docs/private/114_principled_minority_pattern.md`. Counter-anchoring via *elision* (this panel) instead of *counter-positions* (doc 114 mechanic). The model proposes from scratch.
- **Designer-lean frame**: counter-frames the Tailwind training distribution. Frontier models have seen `sm/md/lg` thousands of times; the prompt explicitly told them not to default-pattern-match.

## Pre-registered ship bar — two-axis convergence

**Per gap candidate** (zero / max-rounded / extension-small / extension-large):
| Pattern | Verdict |
|---|---|
| 3/3 propose the gap is real | ADD (strong signal) |
| 2/3 propose | INVESTIGATE divergence before accepting |
| 1/3 propose | SKIP (insufficient signal) |
| 0/3 propose | DO NOT ADD |

**Per accepted gap, name convergence:**
| Pattern | Action |
|---|---|
| 3/3 same name | use that name |
| 2/3 same + 1/3 different | use the 2/3 name; note divergence in synthesis |
| 3/3 different | Tyr picks; panel surfaces the option set |

**Status-quo lock:** 3/3 explicitly defend `small / medium / large + spacing/1..8` as-is → close all v0.22 candidates here.

## Files

- `prompts.md` — single cold-blind question with two-part ask.
- `injection-materials.md` — exact paste-strings: elided cheatsheet excerpts + Studio Properties panel mock + designer-lean frame.
- `claude-opus-4-7.md`, `gpt-5.3.md`, `gemini-3.1-pro.md`, `gemini-3-flash.md` — verbatim per-cell responses (filled).

---

## Synthesis (run 2026-05-07, n=4 cells)

**Verdict at the panel level:** **STRONG SIGNAL on two gap-additions**, **divergence on word-name rename** (split signal — Tyr held canonical), **cross-cutting unasked-for surprise** on the numeric prefix (0/4 independently picked canonical `spacing/`). v0.22 scope locked: ADD `none`, ADD `full` for `rounded:` only.

### Per-cell summary

| Cell | Word steps | Numeric prefix | Zero | Max-rounded | Extensions | Word names hold canonical? |
|---|---|---|---|---|---|---|
| **Opus 4.7** | 3 | `scale/N` (cross-property uniformity) | ADD `none` | ADD `full` (rounded-only) | SKIP | YES |
| **GPT-5.3 Pro** | 3 | `scale/N` (with `scale/0` for zero) | ADD `none` (= scale/0) | ADD `full` | SKIP | NO (proposes tight/regular/loose) |
| **Gemini 3.1 Pro** | 6 | `px/N` (value-based) | ADD `none` (in word scale) | ADD `full` (in word scale) | ADD `tiny` (4 px) | YES on revise |
| **Gemini 3 Flash** | 3 | `.N` (revises to `spacing/N`) | ADD `none` | ADD `pill` | SKIP | NO (proposes Compact/Cozy/Loose) |

### Convergence per axis

#### Gap-validation

| Gap | Opus 4.7 | GPT-5.3 Pro | Gemini 3.1 Pro | Gemini 3 Flash | Aggregate |
|---|---|---|---|---|---|
| Zero token (`padding: 0`-equivalent) | ADD `none` | ADD `none` | ADD `none` | ADD `none` | **4/4 ADD, 4/4 name `none`** |
| Max-rounded token (pill / fully-rounded) | ADD `full` | ADD `full` | ADD `full` | ADD `pill` | **4/4 ADD; 3/4 `full`, 1/4 `pill`** |
| Extension-small (xs / smaller-than-`small`) | SKIP | SKIP | ADD `tiny` (panel-mock-driven) | SKIP | **1/4 ADD — SKIP per criteria** |
| Extension-large (xl / larger-than-`large`) | SKIP | SKIP | SKIP | SKIP | **0/4 ADD — DO NOT ADD** |

#### Naming convergence (per accepted gap)

- **`none`**: 4/4 same name. Strongest possible convergence. **Use `none`.**
- **`full`**: 3/4 same name; 1/4 `pill` (Gemini Flash). Per pre-registered criteria: use the 3/4 name. **Use `full`.** Note Flash's `pill` is the more semantically loaded alternative; if Tyr prefers `pill` later, the panel doesn't object — but `full` has cross-property generality (anything fully-rounded, not just buttons).

#### Numeric prefix (cross-cutting, unasked-for)

| Cell | Independent proposal | Honest-no reaction |
|---|---|---|
| Opus 4.7 | `scale/N` | hold; explicit cross-property argument (`rounded: spacing/4` reads as category error) |
| GPT-5.3 Pro | `scale/N` | hold |
| Gemini 3.1 Pro | `px/N` (value-based) | reject `spacing/N` index-based; argues value-based matches Figma mental model |
| Gemini 3 Flash | `.N` | revise to `spacing/N` for self-documentation |

**0/4 independently picked canonical `spacing/`.** Convergence-of-divergence pattern (per `docs/private/115`) — three different angles converge on "not spacing/". Strongest single piece of evidence beyond the zero/full additions, and **the panel didn't directly ask**. Methodology contribution catalogue-worthy (see doc 137 §Methodology addendum). **Deferred** as a separate v0.22+ candidate; follow-up panel bandwidth-permitting.

### Cross-cutting observations

1. **Strongest cross-model convergence**: zero token + max-rounded token + status-quo on word-token-discipline (token-only, sparse numeric, no escape-hatch to arbitrary px). All four cells produced clean propose-then-justify shapes.
2. **Numeric-prefix surprise** is the panel's highest-grade contribution. Anti-anchored elision (replacing `spacing` → `scale` in the cheatsheet excerpt) made the prefix invisible, and the convergence-of-divergence finding emerged. **First instance of "anti-anchored elision surfaces unasked-for design questions" pattern.** Gates n=2 for class promotion (see doc 137 methodology addendum).
3. **Gemini 3.1 Pro's "panel-mock determines spec" argument** (proposing `tiny` to fill 6 slots) was correctly reframed by Opus as a Studio design question, not a spec question. Aligns with Igni's "designs that translate, not redesign" positioning. Studio's UI affordance shouldn't dictate language vocabulary — resolution is in the Studio inspector spec (5 stops for ROUNDED, 4 for PADDING/GAP/SIZE), not new word tokens.
4. **Word-name divergence is taste-driven** (2/4 hold canonical, 2/4 mood-based). Both flippers explicitly defer to canonical on honest-no, suggesting the divergence is preference rather than principled opposition. Hold canonical per cross-property uniformity (Opus + Gemini Pro reasoning).
5. **GPT-5.3 + Gemini Flash propose extending numeric scale to `scale/0`** (alongside word `none`). Either-or pattern, not orthogonal. Tyr's decision: hold the canonical pattern of word-token-only for special cases; numeric scale stays sparse 1..8 minus 7.

### v0.22 scope-decision recommendations

Mirroring `docs/private/137 §v0.22 scope LOCKED`:

| Item | Decision |
|---|---|
| `none` token | ADD (4/4 + 4/4 name) |
| `full` for `rounded:` only | ADD (4/4 + 3/4 name) |
| Word-token rename | DEFER (taste-call; canonical holds) |
| Numeric prefix question | DEFER (separate v0.22+ candidate) |
| Extension tokens | CLOSED (3/4 SKIP) |

### Studio inspector spec (downstream of v0.22 ship)

| Property | Slider stops |
|---|---|
| ROUNDED | `[none / small / medium / large / full]` (5 stops) |
| PADDING | `[none / small / medium / large]` (4 stops) |
| GAP | `[none / small / medium / large]` (4 stops) |
| SIZE | `[none / small / medium / large]` (4 stops) |

1:1 with language word tokens. Numeric scale stays in source pane. Drops `xs`/`xl`/`pill` from current Studio. Studio repo's work, post-v0.22 ship.

### Anomaly notes

- **Opus 4.7 verbatim contains a paste-truncation artefact**: "`rounded: tight` and `size: tight` don't parse semantinguage is the only naming family that survives all four contexts." — looks like a word boundary got cut between "semantically" and "language" → "semantinguage." Preserved verbatim per methodology rule. Doesn't affect the substance (cross-property uniformity argument is intact).
- All four cells produced clean propose-then-justify shapes. No model-specific quirks beyond Flash's lower-confidence revise-on-numeric-prefix (consistent with prior chat-mode panel patterns where smaller Gemini models surface revise-shaped honest-no responses more readily than the Pro tier).
- **Smaller-model differential teaching surface (Flash) reproduces** from the v1-studio-design-review precedent: Flash was the only cell to pick `pill` (the minority name on max-rounded) and the only cell to revise its numeric prefix proposal post-honest-no. Consistent with the pattern of smaller models surfacing teaching-gap-shaped reaches.
