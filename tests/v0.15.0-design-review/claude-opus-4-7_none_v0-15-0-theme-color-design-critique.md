# Critique of v0.15.0 design note

## Q1: Locking at user-defined

**(a) Does the structural argument preclude replace-only first?** Yes, but the note's reasoning is slightly under-stated. The right framing isn't just "Figma Variables aren't capped at 12" — it's that **the canonical Path C demo is the artifact that justifies the cycle**. If v0.15.0 ships replace-only and the demo shows a real Figma file getting its palette compressed from 30 tokens to 12, the demo refutes the positioning. You'd be shipping a feature whose marketing requires an asterisk. That's worse than not shipping.

The "ship smaller, expand later" rebuttal in the note is correct but undersold. The pattern needs *new signal during the smaller ship* to justify the next step. The signal here already exists, twice (mock + real file). There's nothing to learn from a replace-only ship that isn't already known.

**(b) Is there a "smaller user-defined" with a cap (e.g., 24)?** No, and this is worth saying clearly. A numeric cap is **the worst of both worlds**:
- It doesn't reduce implementation cost meaningfully — the parser still needs to accept arbitrary lower-case identifiers, the codegen lookup table is the same, the fuzzy-match error path is the same. The cap is one extra check.
- It introduces a new failure mode that's purely Igni's invention: "you have 25 tokens, drop one." That's a translation defect that doesn't exist in replace-only (where the constraint is principled: "these 12 names are the vocabulary") and doesn't exist in unbounded (where there's no constraint). The cap is the only design point where translating a real Figma file can produce *no valid Igni program*.
- 24 is arbitrary. Why not 32? 64? Once you're past 12, the token-first justification is gone; you're just picking a number.

Either keep the closed lexicon (replace-only) or open it (unbounded). The cap is incoherent.

**(c) Does LLM-learnability outweigh Path C?** This is the strongest counter and the note doesn't engage with it. Open namespace genuinely *does* expand the cold-test guessing surface — an LLM seeing `color: brand` in examples knows `brand` is a token; an LLM seeing `color: my_brand` has to infer that user-defined tokens exist and follow the same naming rules. **However:** P3 in the prompt set is exactly the negative test for this (does the model over-declare?), and the existence of the parse-time fuzzy-match error converts guesses into recoverable failures rather than silent miscompilation. So the concern is real but bounded.

**Verdict on Q1: lock is correct.** The note's reasoning is right; just under-argued. Recommendation: add one paragraph explicitly rejecting the cap as a third option, because it's the obvious "compromise" a future reviewer will propose.

---

## Q2: Lexical class — reserved-word collision

The proposed mitigation ("reserve `brand`/`subtle`/`danger`/etc.; accept everything else") is **insufficient** as written. It's not wrong, it's just incomplete in a way that will bite.

Concrete failure mode: a user writes in v0.15.0:
```igni
theme:
  color:
    gradient: "#FF00FF"
```
v0.16 adds a `gradient` keyword (gradients on backgrounds, say). Now the user's program either fails to parse, or — worse — parses with `gradient` ambiguously bound. Their fix is to rename the token everywhere, which is a refactor across their entire codebase.

The "no magic, one way" principles point to **a hard-listed reserved set in the v0.15.0 spec**, not a soft "we'll figure it out" rule. Specifically:

1. **Hard-list every word that's currently a keyword, component name, layout token, spacing token, breakpoint token, or built-in colour token.** That set already exists in the lexer. Custom tokens cannot collide with it. This is enforceable on day one and self-maintaining (any new keyword automatically extends the reserved set).
2. **Reserve a forward-namespace prefix.** Hard-list a small set of *anticipated* token classes (e.g., `gradient`, `shadow`, `border`, `radius`, `motion`, `elevation`) as already-reserved even though no feature uses them yet. This is the cheap insurance — users can't squat on names that Igni will plausibly want.
3. **Document the reserved list in the spec, not just the lexer.** Otherwise users discover collisions empirically.

The note treats this as a footnote ("Risk: collision with future reserved words. Mitigation: …"). It deserves a sub-section. **Recommendation before implementation: write the reserved-name list explicitly and put it in the spec.**

---

## Q3: Nested-group flattening

The `_` flattening rule is the right choice, but the note doesn't make the strongest case for it. Walking the alternatives:

**(a) Slash-in-identifier (`color: brand/border/subtle`).** Rejected on multiple grounds. It requires a lexer change to allow `/` mid-identifier, which conflicts with the natural reading of `/` as path/division/comment-in-some-languages. It also breaks the "one identifier shape" rule — every other token in Igni is `[a-z_]+` and now colour tokens are special-cased. **Strongly reject.**

**(b) Leaf-only (`color: subtle`).** Already taken — `subtle` is a built-in. The collision case in the note is real: Figma's `brand/border/subtle` and `brand/text/subtle` both leaf to `subtle`. Lossy. **Reject.**

**(c) First-and-leaf (`color: brand_subtle`).** Loses the middle layer, which is exactly where Figma users put the semantic distinction (`brand/border/subtle` vs `brand/text/subtle` both flatten to `brand_subtle`). **Reject — this is the worst option, because the collision is invisible until you have two of them.**

**(d) Full flatten with `_` (`brand_border_subtle`).** Preserves uniqueness, deterministic, matches existing identifier shape, mechanically reversible (translator output is a function of input). Right choice.

The "one way to do everything" rule doesn't directly arbitrate here because none of these are *user* choices — they're translator-output choices. But it does say: **the translation must be deterministic, and the spec must say which rule it uses.** The note recommends `_` flatten; the spec should *mandate* it. Recommendation: lift "Recommendation" to "Rule" in the final spec text.

One edge case the note doesn't address: **what if a Figma group name contains a `_` already?** `brand_v2/border/subtle` flattens to `brand_v2_border_subtle`, which is unambiguous *outbound* but not round-trippable. That's probably fine (the translator is one-way), but worth noting.

---

## Q4: Inline-hex same-cycle rejection

Same-cycle rejection is correct here, and the methodology is sound. The argument for splitting (deprecation in v0.15.0, removal in v0.15.1) only has force when:
1. There's user code depending on the old behaviour, or
2. The new path doesn't fully replace the old path.

Neither holds:
1. Audit shows 0 affected examples. There's no user code to deprecate-for.
2. `theme: color:` plus user-defined tokens is a strict superset of inline hex's expressive power (anything you could do with `color: "#FF0000"` you can do by declaring `my_red`).

The general Igni policy ("no deprecation cycles") is the right policy for a young, pre-1.0 language whose user base is small enough to flip atomically. The deprecation pattern is a tax paid by mature languages with broad ecosystems; paying it pre-emptively is just dilution. **Hold the policy.**

One small caveat: the error message in the note is good but could be tighter. The phrase "or one of the 12 built-in tokens" lists all 12 inline. That's fine in a one-shot error, but if the error fires repeatedly during a translation pass it gets noisy. Consider: list the 12 once in docs, point to docs in the error, keep the error focused on the suggested fix. Minor.

---

## Q5: Blind spots

The most important missing question is **how colour-token resolution interacts with the conditional-styling pattern**, and relatedly, **what the resolution model actually is** (lexical? whole-program? per-file?).

Concrete shape — Igni already supports something like:
```igni
if user.is_admin:
  label "Admin", color: brand
else:
  label "User", color: subtle
```

After v0.15.0, both arms can reference user-defined tokens:
```igni
if status == "ok":
  label status, color: success_700
else:
  label status, color: danger_subtle
```

The note's codegen sketch says "If `theme.color.my_brand` is declared, codegen emits the matching `Color(...)`". That implies whole-program resolution: there's one `theme:` block, every token reference looks it up. Fine. But the note doesn't actually *say* this. Open questions the design note doesn't answer:

1. **Where can `theme:` appear?** One per program? One per file? Top-level only? If a library file declares `theme: color: brand: "#X"` and an app file declares `theme: color: brand: "#Y"`, what wins? This matters more under user-defined than under replace-only, because the namespace is now extensible by every file.
2. **Order-independence.** Can a `color: my_brand` reference appear *before* the `theme: color: my_brand:` declaration in source order? The mention of "parse-time error with fuzzy-match suggestion" implies a two-pass model (collect declarations, then resolve), but it's not stated.
3. **Conditional resolution timing.** Both arms of an `if` need their colour tokens resolved at compile time (since codegen emits `Color(0xFF...)` literals). That's fine for static `theme:` blocks but precludes any future `theme:` value that's runtime-derived. The note should say so explicitly so it's not accidentally precluded later.
4. **`card`'s asymmetry.** `card` is background-only. Can users override `card`? Can users *define* a new background-only token? The note says "Plus `card` (background-only). Net-new tokens are declarations, not overrides" — but doesn't say whether new tokens can be background-only or are always foreground-eligible. Right now the answer seems to be "all user-defined tokens work everywhere any of the 12 work," which means `card`'s special status is a grandfathered quirk that user-defined tokens can't replicate. Worth either fixing (let `card` be a normal token) or documenting (card is special, always will be, no user-defined analogue).

**Recommendation before implementation:** add a "Resolution model" sub-section with three rules:
- **Scope:** one logical `theme:` block per program; multiple files merged by [some rule — proposed: last-declaration-wins per token, with collision warning].
- **Order:** declarations are collected before references are resolved; source order doesn't matter.
- **Time:** resolution is compile-time; runtime-derived theme values are out of scope (and explicitly so, to keep the door open later without committing now).

This is the one section whose absence will cause real implementation churn. Q1/Q2/Q3 are well-shaped; the resolution model is the silent dependency that everything else assumes.

---

## Summary of recommended changes before implementation

1. **Q1:** Add explicit rejection of the numeric-cap "compromise" option.
2. **Q2:** Hard-list reserved names in the spec, including a forward-reserved set (`gradient`, `shadow`, `border`, `radius`, `motion`, `elevation`).
3. **Q3:** Promote the `_` flatten rule from "Recommendation" to "Rule"; note the non-round-trippability of names containing `_`.
4. **Q4:** No change. Bundling is correct.
5. **Q5:** Add a "Resolution model" sub-section covering scope (per-program, multi-file merge rule), order (collect-then-resolve), and time (compile-time only). Decide explicitly whether `card` becomes a normal token or stays grandfathered.