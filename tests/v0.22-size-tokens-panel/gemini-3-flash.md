# Gemini 3 Flash — v0.22 size-token cold-blind proposal

**Run date:** 2026-05-07
**Session shape:** TBD — operator confirms (one-message / two-message)
**Cheatsheet version:** v0.21.2
**Design note:** docs/private/137_studio_drift_size_token_gaps.md as of 2026-05-07
**Notes:** 4th cell — noise-tier comparison; smaller-model differential-teaching-gap-surface role per `tests/v1-studio-design-review/` precedent.

---

<!-- Paste verbatim model response below this marker. Don't trim, paraphrase, or add operator commentary. -->

## Proposed scale

### 1. Named Steps (Semantic Shorthand)
The word-token scale uses full, lowercase descriptive nouns/adjectives. This avoids the "developer-centric" feel of abbreviations and aligns with the descriptive properties found in design tool inspectors.

*   **Compact** (8 px) - *Refining <token_A>*
*   **Cozy** (16 px) - *Refining <token_B>*
*   **Loose** (24 px) - *Refining <token_C>*

### 2. Numeric Scale (The "Rule of 4" Grid)
The numeric scale remains **sparse** to enforce design discipline and prevent "pixel-pushing" outside the grid. It uses a `.` prefix to distinguish it from literals (which are invalid) and identifies the step on a 4 px base grid.

*   Form: `.1` through `.8` (Multiples of 4 px)
*   Valid Tokens: `.1` (4 px), `.2` (8 px), `.3` (12 px), `.4` (16 px), `.5` (20 px), `.6` (24 px), `.8` (32 px).

---

## Special-case decisions

*   **Zero-value token:** **ADD (`none`)**. Essential for layout overrides where a parent's default padding must be flattened to flush edges. `padding: none` is more readable than `.0`.
*   **Max-value token for `rounded:`:** **ADD (`pill`)**. Designing a button or badge requires a "maximum" radius that isn't tied to a specific pixel value. While `rounded: .8` (32 px) might work for small buttons, it fails for large ones. `rounded: pill` ensures a perfect arc regardless of height.
*   **Extension tokens:** **SKIP**. The current 3-step word scale (`8/16/24`) covers the "meat" of UI spacing. Rare extremes (4 px or 32 px) are better handled by the numeric scale to keep the semantic vocabulary lean and memorable.

---

## Justification

The choice of **Compact**, **Cozy**, and **Loose** moves away from the "T-shirt sizing" of web development and toward the "spatial density" language used in modern design systems (like Material or Polaris). In a Properties panel, these labels feel like *intent* rather than *specifications*. `Compact` communicates a dense data view; `Loose` communicates a marketing or "airy" hero section. These names transition seamlessly across properties: `rounded: compact` feels like a subtle 8 px radius, while `gap: compact` describes a tight list.

The numeric scale uses a `.N` notation to act as a "specifier." Since Igni prohibits naked integers (e.g., `gap: 12`), the dot serves as a visual signal that the user is invoking a grid step. This is highly ergonomic for the "Figma + LLM" pair; the LLM can easily map a 20 px measurement from Figma to the `.5` token. Using a sparse scale here is a feature, not a bug—it forces the designer to stick to the system's 4 px rhythm, which is the "Invisible Hand" of high-quality UI design.

The inclusion of `none` and `pill` addresses the two most common "functional" outliers in design. `none` is a logic gate (on/off), and `pill` is a geometric constraint. Neither fits well into a linear numeric scale. By adding these, we prevent the need for an "escape hatch," keeping the DSL strictly tokenized while satisfying 100% of standard UI layout requirements.

---

## Honest-no reaction

**Partial Revise.**

I prefer my choice of **Compact / Cozy / Loose** over the canonical **Small / Medium / Large**. The canonical names are "safe" and highly recognizable by LLMs, but they carry the baggage of utility CSS. However, I would adopt the canonical **`spacing/N`** prefix over my `.N` notation. While `.N` is shorter, `spacing/4` is more self-documenting for a human reading the code for the first time and aligns better with the "slashed" path convention seen in Figma component naming (e.g., `Icons/Alert/Small`).

---

**Confidence:** HIGH.
