# GPT-5.3 Pro — v0.22 size-token cold-blind proposal

**Run date:** 2026-05-07
**Session shape:** TBD — operator confirms (one-message / two-message)
**Cheatsheet version:** v0.21.2
**Design note:** docs/private/137_studio_drift_size_token_gaps.md as of 2026-05-07

---

<!-- Paste verbatim model response below this marker. Don't trim, paraphrase, or add operator commentary. -->

## Proposed scale

### 1) Named steps (word tokens)

I'd keep **three semantic steps** as the primary named surface, because that's the minimum set that still maps cleanly across all four properties (`gap`, `padding`, `rounded`, `size`) without overfitting any one of them:

1. **tight** → 8px

   * Compact spacing / subtle radius / small size increment

2. **regular** → 16px

   * Default working unit; the "normal" design rhythm

3. **loose** → 24px

   * Spacious layout / stronger radius / larger visual weight

Aliases:

* `tight = scale/2`
* `regular = scale/4`
* `loose = scale/6`

These read naturally in both surfaces:

* Source: `padding: regular`
* Panel button: `[tight | regular | loose]`

That matters more than brevity.

---

### 2) Numeric companion

**Yes.**

Form:

* `scale/0` → 0px
* `scale/1` → 4px
* `scale/2` → 8px
* `scale/3` → 12px
* `scale/4` → 16px
* `scale/5` → 20px
* `scale/6` → 24px
* `scale/8` → 32px

Properties:

* **Sparse**
* Explicit whitelist
* No arbitrary pixel escape hatch

This keeps the design-system discipline intact while supporting Figma translation ("this frame has 12px padding") without forcing semantic approximation.

---

## Special-case decisions

### Zero-value token

**ADD** → `none`

Reason: zero is a real layout state, not an edge case.

Examples:

* `padding: none`
* `gap: none`

I would map:

* `none = scale/0`

Not part of the three semantic density steps; it's a structural reset.

---

### Max-value token for rounded

**ADD** → `full`

Reason: pill buttons and circular avatars are common enough to deserve first-class expression.

Examples:

* `rounded: full`

This is **property-special semantic behaviour**, not a pixel value.
Equivalent to "max radius".

Not part of numeric scale.

---

### Extension tokens beyond 3-step word scale

**SKIP**

Reason: the numeric scale already covers intermediate precision (4, 12, 20, 32). Adding `compact`, `spacious`, `xl`, etc. duplicates capability and bloats the vocabulary.

Keep semantic vocabulary shallow; push precision into numeric.

---

## Justification

Three semantic steps is the right size because semantic tokens exist to communicate **intent**, not precision. Designers usually think in a small number of spacing moods ("tight", "normal", "airy"), while exact values come from specs. If the semantic surface grows beyond three or four, it stops being semantic and starts becoming another numeric system with names attached. Igni already has a numeric rail for precision, so the semantic rail should stay compact.

The naming should feel native in both code and a properties panel. `tight / regular / loose` reads like design intent, not engineering shorthand. Compare `small / medium / large`: those work for `size`, but feel less native for `gap` ("large gap" is fine, but "loose gap" better implies breathing room). For `rounded`, `tight rounded` is a bit unusual, but still interpretable as restrained radius. `regular` and `loose` also carry well there. That's the core constraint: one scale must survive four contexts. These names optimise for cross-property coherence rather than any single property.

The special cases deserve special handling because they're qualitatively different. Zero (`none`) is absence, not "smallness." Fully rounded (`full`) is relational, not scalar. Those are not extension steps; they're mode switches. That distinction keeps the core scale clean.

---

## Honest-no reaction

**Partial revise.**

Seeing the canonical `small / medium / large` + `spacing/1..8`, I'd keep my structural decisions (3 semantic + sparse numeric + zero + full), but I can see the argument for `small / medium / large` because they're more neutral across `size:` and `rounded:` than `tight / regular / loose`.

If shipping today, I'd probably still hold `tight / regular / loose` because they feel more design-native for spacing. But `small / medium / large` is a strong alternative and likely easier for first-time users.

---

## Confidence

**MEDIUM**
