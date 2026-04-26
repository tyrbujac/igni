---
name: figma-translation
description: Use this skill when doing Path C hand-translation work — translating a Figma design (or Figma-shaped mock) into Igni source. Triggers on phrases like "hand-translate this Figma file", "Path C empirical resolution", "Figma Variables to Igni theme:", "auto-layout to Igni layout:", "import a Figma design", or when the user shares Figma screenshots / Variable lists / auto-layout frame structure asking for Igni equivalents. Also loads when Tyr is reasoning about which v0.15+ spec primitives are needed to support a real Figma file. Do NOT load for unrelated cookbook entries, raw spec edits without Figma context, or non-Path-C work.
---

# Figma → Igni hand-translation reference

Path C (`docs/private/97_figma_to_igni_workflow.md`) commits Igni to "match Figma's vocabulary where it fits Igni's flow-layout model; reject what would break it." Hand-translation is the empirical check that the vocabulary match holds. Phase 1 (mock, `docs/private/99`) and Phase 2 (real Figma, `docs/private/100`) ran 2026-04-26 and locked v0.15.0 Q1 at user-defined colour tokens.

## Auto-layout → Igni `layout` (clean mapping)

| Figma | Igni |
|---|---|
| `layoutMode: VERTICAL` | `layout vertical:` |
| `layoutMode: HORIZONTAL` | `layout horizontal:` |
| `itemSpacing` | `gap:` (use `small` 8 / `medium` 16 / `large` 24 — exact px in v0.15.1+ token scale) |
| `paddingTop/Right/Bottom/Left` (uniform) | `padding:` (single token) |
| `paddingTop/Right/Bottom/Left` (asymmetric) | **REJECT** — Igni's `padding:` is single-value (v0.16+ candidate logged) |
| `primaryAxisAlignItems` | `align:` (start/center/end) |
| `counterAxisAlignItems: STRETCH` | (default — children stretch cross-axis) |
| `layoutSizingHorizontal: FILL` | `fill: true` (with sibling-equal-split semantics) |
| `layoutSizingHorizontal: HUG` | (default — Igni's natural-size behaviour) |
| `cornerRadius` | `rounded: small/medium/large` |
| Frame width cap | `max_width: phone/tablet/desktop` (480/768/1200) |

## Variables → `theme:` (canonical mapping)

| Figma Variable | Igni `theme:` path |
|---|---|
| Colour Variable, named `brand` (or one of 12 built-ins) | `theme: color: brand: "#RRGGBB"` (override) |
| Colour Variable, custom name (`primary_700`, `surface_elevated`, etc.) | `theme: color: <name>: "#RRGGBB"` (user-defined token) |
| Colour Variable, nested group (`brand/border/subtle`) | flatten with `_` → `theme: color: brand_border_subtle: "#RRGGBB"` |
| Spacing Variable | (v0.15.1) `theme: spacing: <name>: <int>` — currently absent; map to closest of `small`/`medium`/`large` |
| Type token (`heading: pacifico`) | `theme: text: heading: font: pacifico` (v0.12.1+) |
| Mode-variant Variable (light/dark) | **DEFER** — dark mode parked v0.16+ |

## Reject list (Path C scope)

These Figma features do NOT map to Igni and should produce a translator error pointing at the fix:

- **Inline hex codes outside `theme:` block** — `color: "#FF0000"` and `background: "#FFFFFF"` are parse-time errors in v0.15.0+. Define a `theme: color:` token; reference by name.
- **Raw pixel dimensions on arbitrary primitives** — `gap: 12` is a v0.15.1+ candidate via numeric spacing tokens; until then, use named tokens. Avoid `padding: 17` (no token covers it).
- **Absolute-positioned frames** — Igni has no absolute-positioning primitive. Translator error pointing at "convert to auto-layout in Figma."
- **Per-element animations** — Igni doesn't model animation. Tracked-open-question backlog.
- **Opacity / alpha-channel tokens** — `"#RRGGBBAA"` not yet supported (v0.15.x candidate per Stage 2 1/3 signal). Strip alpha for v0.15.0 or use the closest `theme: color:` solid match.
- **Per-element shadows (current)** — `shadow:` on layouts is a v0.15.3 candidate. Until shipped, omit and document.
- **Borders (current)** — `border:` on layouts is a v0.15.2 candidate. Until shipped, omit and document.
- **Mixed auto-layout + absolute siblings within a frame** — pick one mode per frame; if Figma mixes them, refactor.

## Naming flatten rule (locked v0.15.0)

`brand/border/subtle` (Figma path) → `brand_border_subtle` (Igni token).

Rules:
- Lowercase all segments.
- Replace any non-alphanumeric character with `_`.
- Collapse repeated `_`.
- Result must match `[a-z][a-z0-9_]*`.
- If two Figma names normalise to the same Igni token, **error** (don't silently merge).

## When to invoke the hand-translation gate

Doc 97 condition (e) — gate before plugin/MCP commitment. Doc 98 §"Stage-1 prerequisite" — gate before locking v0.15.x scope decisions.

The exercise: 2 hours, one real Figma file (designer's portfolio, friend's design system, public file). Translate by hand to Igni source, capture:

1. Token counts per category (colour / spacing / typography / shadow).
2. Coercion count (how many "this Figma pattern doesn't map cleanly" moments).
3. Which v0.15.x candidates the file actually exercises.
4. Whether the result reads cleanly *as Igni* — does the translation honour Igni's spec, or feel like Flutter-in-disguise?

Outcomes route:

- **12 colour tokens suffice** → spec lock can stay at replace-only.
- **30+ colour tokens needed** → spec lock at user-defined (the v0.15.0 outcome).
- **File uses non-flat colours (gradient / opacity / blend)** → new v0.15.x design questions.
- **Auto-layout coercion ≥5 patterns** → revisit Path C itself.

## Common pitfalls

- **"This Figma file uses 11 tokens; replace-only suffices"** — phase 2 (`docs/private/100`) hit exactly this size on a small file. Doesn't refute the user-defined lock — the locking signal was *real designers reach for ≥30 tokens*; small files are not the typical case.
- **"Slash-preservation in Igni token names"** — explicitly rejected in Stage 2; lexer ambiguity vs path semantics. Always flatten.
- **"Figma's #FFFFFF80 (with alpha) — just use #FFFFFF"** — silent fidelity loss. Document the alpha-channel limitation; route to Stream 3 candidate.
- **"This designer hand-coded hex everywhere instead of using Variables"** — that's a designer-discipline issue, not a Variables-don't-exist issue. The Igni translation should use Variable-equivalent `theme: color:` tokens; flag the Figma-side opportunity.

## Files to know

- `docs/private/97_figma_to_igni_workflow.md` — Path C scope, plugin/MCP framing, hand-translation gate definition.
- `docs/private/99_handtranslation_phase1_mock.md` — phase 1 mock results (23 colour tokens, 10 spacing).
- `docs/private/100_handtranslation_phase2_real.md` — phase 2 real Figma walkthrough (11 Variables, nested-group naming surface).
- `docs/cookbook.md` — Igni-side patterns (centring rows, max_width caps, etc.) the translation maps to.
- `spec/v0.15.0.md` §`theme: color:` — current spec for token translation.

## Operational

- Hand-translation is **always Tyr-driven** — Claude doesn't have Figma access; Tyr provides screenshots / Variable lists / auto-layout property dumps and Claude assists with the Igni equivalent.
- Output: `docs/private/<n>_handtranslation_<scope>.md` with per-section findings (token counts, coercions, v0.15.x candidates surfaced).
- Per the automation principle (`docs/private/104`), synthesis of "what does this hand-translation imply for v0.15.x scope" is human-mediated. Claude assists with translation; Tyr decides the spec implications.

## When this skill applies

Translating Figma designs to Igni. Scoring Path C alignment. Deciding whether to add a v0.15.x candidate based on real-Figma evidence. Drafting hand-translation gate findings.

When this skill does NOT apply: pure spec design without Figma context (use `spec-cycle` skill instead), cookbook entries unrelated to translation, or v0.15.x cycles whose primary input is cold-test panels rather than Figma data.
