## Bottom line

The user-defined-token decision is right **for Path C**. Replace-only would be simpler, but it would not prove “Figma Variables map to Igni `theme:`” in any honest sense. The design should proceed with user-defined colour tokens.

However, the note is under-specified in three load-bearing places:

1. **Token-name grammar and reserved-name policy** are not precise enough.
2. **Figma name normalization** is missing, especially for hyphens, spaces, slashes, uppercase, and collisions.
3. The examples contradict the proposed hex grammar: `"#999"` appears, but the note says only `"#RRGGBB"`.

Those should be fixed before implementation.

---

# Q1: Q1 lock at user-defined

## Verdict: user-defined is the right call.

The note’s conclusion is correct. If v0.15.0 is supposed to be the first Path C proof point, replace-only is not enough.

### a) Does the structural Figma argument preclude shipping replace-only first?

Strictly speaking, no. You *could* ship replace-only first as an incremental implementation step.

But you could not honestly present it as the canonical Path C demo.

Figma Variables are not a fixed palette of 12 semantic names. Real design systems commonly have:

```text
primary-50
primary-100
primary-200
primary-700
surface-elevated
text-muted
accent-1
accent-2
brand/border/subtle
```

A replace-only system forces all of that into:

```igni
brand
subtle
danger
green
red
blue
...
```

That is not vocabulary matching. That is lossy compression.

So the right distinction is:

- **Replace-only is acceptable only if v0.15.0 is scoped as “brand override MVP.”**
- **Replace-only is not acceptable if v0.15.0 is scoped as “prove Figma Variables → Igni `theme:`.”**

Given the stated Path C positioning, user-defined is the right lock.

### b) Is there a “smaller user-defined”, such as a 24-token cap?

A cap is the wrong simplification.

A token-count cap adds spec complexity without materially reducing implementation complexity. The compiler still needs:

```text
theme.color: Map<TokenName, HexColor>
```

Whether the map contains 12, 24, or 80 entries barely changes implementation cost.

A cap would also create an arbitrary failure mode:

```text
Error: theme: color: supports at most 24 tokens.
```

That is bad for Path C because real files can exceed it naturally. It also teaches LLMs another irrelevant rule.

If you want a smaller implementation, the better constraints are:

- Only support **flat Igni token names** in v0.15.0.
- Require Figma import/translation to flatten names before generating Igni.
- Support only one hex form: `"#RRGGBB"`.
- No aliases.
- No nested `theme: color:` structure in Igni source.

That is smaller without being artificial.

So:

```igni
theme:
  color:
    primary_700: "#1D4ED8"
    surface_elevated: "#FFFFFF"
    brand_border_subtle: "#D0D5DD"
```

Good.

But a numeric cap like 24 is not worth it.

### c) Does LLM learnability outweigh Path C alignment?

No.

Open token namespaces do increase the possibility that an LLM invents a token:

```igni
label "Done", color: success
```

without declaring:

```igni
theme:
  color:
    success: "#00AA00"
```

But that failure mode is clear and compiler-detectable.

Also, user-defined tokens can improve LLM accuracy when the prompt gives explicit semantic names:

> Use `success`, `danger_subtle`, and `primary_700`.

The one-way rule is still preserved if the language says:

```igni
theme:
  color:
    success: "#00AA00"

label "Online", color: success
```

There is still one way to declare a custom colour and one way to use it.

The bigger LLM risk is not “open namespace” itself. The bigger risk is an underspecified naming transform from Figma names to Igni identifiers. That needs to be nailed down.

---

# Q2: Token-name lexical class and reserved-word collision

## Verdict: “accept any lower-case identifier” is too vague.

The proposed mitigation is not sufficient:

> continue reserving `brand`/`subtle`/`danger`/etc. as special, accept any other lower-case identifier as a custom token.

That does not address future language evolution.

Example:

```igni
theme:
  color:
    gradient: "#FF00FF"

box:
  background: gradient
```

If v0.16 later adds a `gradient` keyword or value form, the v0.15.0 program may become ambiguous or invalid.

Possible future syntax:

```igni
background: gradient
```

Does that mean:

1. Use the user-defined colour token named `gradient`, or
2. Use the built-in gradient feature?

That is exactly the kind of branch Igni tries to avoid.

## Recommended change

Define a precise token-name grammar and a reserved-name rule now.

For example:

```text
colour_token_name =
  lower_snake_identifier
  excluding reserved words
```

Where:

```text
lower_snake_identifier =
  [a-z][a-z0-9_]*

reserved words include:
  all Igni keywords,
  all component names if globally reserved,
  all built-in style literals,
  true/false/null if present,
  all built-in colour tokens,
  card,
  and explicitly reserved future colour words such as gradient and transparent if likely.
```

But there is a nuance: built-in colour tokens need to remain usable as override names.

So the rule should probably be:

```text
A theme: color: key may be either:
  1. one of the built-in colour names, meaning override, or
  2. a custom colour token name that is not reserved.
```

Example:

```igni
theme:
  color:
    brand: "#6C5CE7"       # allowed: built-in override
    success: "#00AA00"     # allowed: custom
    if: "#FF0000"          # rejected: keyword
    gradient: "#FF00FF"    # maybe rejected if reserved for future colour feature
```

## Alternative compatibility rule

Another valid approach is to make keywords contextual and promise that future keywords will not break names in `theme: color:` key position.

That is more flexible, but it needs to be explicit.

For example:

```text
Colour token names are parsed contextually. A future Igni keyword does not invalidate an existing colour token declaration unless explicitly listed as reserved for colour tokens.
```

But given Igni’s “one way, no magic” philosophy, I would prefer a simple hard-list.

## Specific issue with “lower-case identifier”

The note says real Figma names include:

```text
primary-50
accent-1
surface-elevated
text-muted
brand/border/subtle
```

But those are not lower-case identifiers if Igni identifiers only allow letters, digits, and underscores.

The implementation needs to say whether these become:

```igni
primary_50
accent_1
surface_elevated
text_muted
brand_border_subtle
```

That is not optional. It is central to Path C.

---

# Q3: Nested-group flattening

## Verdict: flatten with `_` is the right rule.

The recommendation:

```text
brand/border/subtle → brand_border_subtle
```

is the best fit for Igni.

It preserves hierarchy while staying inside the existing identifier style.

## Alternatives

### a) Preserve slash

Example:

```igni
label "Hi", color: brand/border/subtle
```

I would reject this.

It requires a lexer/parser change and introduces a second kind of token reference. It also visually looks like a path expression or division-like operator. Even if Igni does not currently use `/` that way, it is unnecessary syntax surface.

It violates the spirit of:

```text
one way to do everything
indentation, no brackets
token-first
```

Colour tokens should look like other tokens:

```igni
color: brand_border_subtle
```

not like paths:

```igni
color: brand/border/subtle
```

### b) Leaf-only

Example:

```text
brand/border/subtle → subtle
text/subtle → subtle
```

Reject.

This loses information and creates collisions immediately. It also collides with Igni’s existing built-in `subtle`.

Bad output:

```igni
theme:
  color:
    subtle: "#D0D5DD"
```

Was that `brand/border/subtle`? `text/subtle`? `surface/subtle`?

The answer is no longer visible in source.

### c) First-and-leaf

Example:

```text
brand/border/subtle → brand_subtle
```

Also reject.

It is less bad than leaf-only, but it still discards middle hierarchy. These two paths collide:

```text
brand/border/subtle
brand/fill/subtle
```

Both become:

```text
brand_subtle
```

That is unacceptable for Figma imports.

## Preferred rule

Use full-path flattening with `_`.

```text
Figma path segments are joined with `_`.
```

Examples:

```text
brand/border/subtle  → brand_border_subtle
surface/elevated     → surface_elevated
text/muted           → text_muted
primary/700          → primary_700
```

But the design note needs a full canonical normalization rule, not just slash flattening.

Recommended rule:

```text
For imported Figma colour variable names:
1. Lowercase all segments.
2. Replace any run of non [a-z0-9] characters with `_`.
3. Join path segments with `_`.
4. Collapse repeated `_`.
5. Remove leading/trailing `_`.
6. Result must match [a-z][a-z0-9_]*.
7. If two variables normalize to the same token, emit an error and require manual rename.
```

Example collisions:

```text
brand/border-subtle
brand-border/subtle
brand/border_subtle
```

All may normalize to:

```text
brand_border_subtle
```

The compiler/importer must not silently pick one.

## One-way rule

The one-way rule strongly favors:

```igni
brand_border_subtle
```

as the only Igni representation.

Do not allow both:

```igni
brand/border/subtle
brand_border_subtle
```

That would create two valid syntaxes for the same token.

---

# Q4: Inline-hex same-cycle rejection

## Verdict: same-cycle rejection is the right call.

Bundling `theme: color:` with inline-hex rejection is coherent.

Before:

```igni
label "Hi", color: "#FF0000"
```

After:

```igni
theme:
  color:
    my_red: "#FF0000"

label "Hi", color: my_red
```

That is the canonical token-first story.

A deprecation warning cycle would temporarily create two ways to do the same thing:

```igni
label "Hi", color: "#FF0000"  # old, warned
label "Hi", color: my_red     # new, preferred
```

For Igni, that is worse than a direct rejection, especially because:

- Inline hex was undocumented.
- Examples audit found 0 usages.
- The language has not historically used deprecation cycles.
- v0.x implementation can reasonably make cleanup changes.
- The error can provide an exact migration.

So I would keep same-cycle rejection.

## One caveat

The rejection must apply consistently to every colour-valued property, not just `color:`.

For example, reject all of these outside `theme: color:`:

```igni
label "Hi", color: "#FF0000"
layout vertical, background: "#FFFFFF"
button "Delete", border_color: "#E74C3C"
```

assuming those properties exist.

The diagnostic should mention the property-specific replacement.

For `background: "#FFFFFF"`:

```igni
theme:
  color:
    page_background: "#FFFFFF"

layout vertical, background: page_background
```

Also, the error message currently lists the 12 built-ins but omits `card`. That is okay for `color:`, because `card` is background-only. But for `background:`, the message should include `card`.

---

# Q5: Blind spots / missing risks

The most important missing issue is **name normalization and collision handling for Figma-derived tokens**.

The note says user-defined tokens are necessary because Figma has names like:

```text
primary-50
accent-1
surface-elevated
text-muted
brand/border/subtle
```

But the proposed Igni examples use:

```igni
primary_700
my_brand
danger_subtle
```

The design never specifies how to get from the Figma names to the Igni names.

That is a major Path C gap.

## Missing concrete rule

The design should add a section like:

```text
Figma variable name mapping

Figma variable paths are converted to Igni colour token names by:
- lowercasing,
- replacing spaces, hyphens, slashes, and other separators with `_`,
- joining nested groups with `_`,
- collapsing repeated `_`,
- requiring the final name to match [a-z][a-z0-9_]*,
- rejecting collisions.
```

Examples:

```text
primary-50              → primary_50
accent-1                → accent_1
surface-elevated        → surface_elevated
text/muted              → text_muted
brand/border/subtle     → brand_border_subtle
Brand / Border / Subtle → brand_border_subtle
```

Collision example:

```text
brand/border-subtle
brand-border/subtle
```

Both normalize to:

```text
brand_border_subtle
```

That should be an import/translation error, not silent overwrite.

## Second blind spot: `"#999"` contradicts `"#RRGGBB"`

The note says:

```text
Hex strings use "#RRGGBB" syntax.
```

But the example includes:

```igni
subtle: "#999"
```

That is a problem.

Igni should not support both shorthand and full hex unless it intentionally wants two ways to express the same colour.

So the example should be changed to:

```igni
subtle: "#999999"
```

and the parser should reject:

```igni
theme:
  color:
    subtle: "#999"
```

with:

```text
Error: Colour hex values must use "#RRGGBB".
```

Supporting `#RGB` and `#RRGGBB` would be convenient, but it violates the spec-budget/one-way principle.

## Third blind spot: `card` needs clearer semantics

The note says:

> Plus `card` background-only.

But then it says:

> The 12 existing colour tokens are all overridable via the same syntax. Plus `card`.

This raises several questions:

```igni
theme:
  color:
    card: "#FFFFFF"
```

Allowed? Presumably yes.

But then:

```igni
label "Hi", color: card
```

Is this still rejected because `card` is background-only?

If yes, the note should explicitly say:

```text
card may be overridden in theme: color:, but remains valid only for background-like properties.
```

Also, what about custom tokens?

```igni
theme:
  color:
    surface_elevated: "#FFFFFF"

layout vertical, background: surface_elevated
label "Hi", color: surface_elevated
```

Are custom colour tokens usable in both foreground and background positions?

I assume yes. If so, `card` is uniquely restricted. That is a special case and should be documented.

## Fourth blind spot: Stage 0 tests do not exercise the hardest part

The pre-registered prompts test basic declaration and use:

```igni
theme:
  color:
    success: "#00AA00"
```

Good, but they do not test Path C’s actual hard case: Figma-like names.

Add a cold test:

> Build a screen using Figma colour variables `primary-700: #1D4ED8`, `surface/elevated: #FFFFFF`, and `brand/border/subtle: #D0D5DD`.

Expected:

```igni
theme:
  color:
    primary_700: "#1D4ED8"
    surface_elevated: "#FFFFFF"
    brand_border_subtle: "#D0D5DD"
```

Also add a negative/rejection test:

> Build a red warning label using `#FF0000`.

Pass should not be:

```igni
label "Warning", color: "#FF0000"
```

Pass should be:

```igni
theme:
  color:
    warning: "#FF0000"

label "Warning", color: warning
```

## Recommended changes before implementation

I would make these edits before v0.15.0 implementation:

1. **Lock user-defined tokens.** Keep the current Q1 decision.
2. **Define token-name grammar exactly.**

   ```text
   [a-z][a-z0-9_]*
   ```

3. **Define reserved-name exclusions.**
4. **Add Figma normalization and collision rules.**
5. **Change `"#999"` to `"#999999"` or explicitly choose to support shorthand. Prefer full-only.**
6. **Clarify `card`: overridable but still background-only.**
7. **Add Stage 0 prompts for hyphenated/nested Figma names and inline-hex rejection.**

With those fixes, the design is directionally strong and aligned with Path C.