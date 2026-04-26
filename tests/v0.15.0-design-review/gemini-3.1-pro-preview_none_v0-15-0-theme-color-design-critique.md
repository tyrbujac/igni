Here is a direct critique of the v0.15.0 design note across the five requested dimensions.

### Q1: Q1 lock at user-defined
**The lock at user-defined is the correct strategic call.** 
*   **(a) Does the structural argument preclude replace-only?** Yes. Path C’s north star is proving Igni can consume Figma’s vocabulary natively. You cannot demonstrate a 1:1 vocabulary match while simultaneously compressing a 30-token semantic design system down to 12 arbitrary fixed names. Replace-only would require a translation layer that destroys the designer's intent, instantly failing the Path C mandate.
*   **(b) Is there a "smaller user-defined" (e.g., cap at 24)?** No. An arbitrary numeric cap violates the "No magic" principle. It doesn't save implementation cost (the parser still needs to accept arbitrary identifiers, and the codegen still needs a dynamic lookup table), and it creates a highly frustrating failure mode where the 25th token throws a mysterious compile error. 
*   **(c) Does LLM-learnability outweigh Path C alignment here?** No. While an open token namespace *does* increase the surface area for LLM hallucination (e.g., guessing `text_primary` instead of `primary_text`), the design note includes a vital mitigation: **parse-time errors with fuzzy-match suggestions**. Since LLMs in a development loop can ingest compiler errors to self-correct, the fuzzy-matching makes the open namespace safe enough to proceed.

### Q2: Token-name lexical class — risks of opening the namespace
**The proposed mitigation (reserve only the 12 existing colors) is dangerously insufficient.**
If the lexer accepts *any* lower-case identifier as a custom token, a user can absolutely declare `theme: color: gradient: "#FF0000"`. When v0.16 introduces `gradient` as a language keyword, that user's code will break catastrophically. Furthermore, allowing tokens named `layout`, `button`, or `true` creates severe parsing ambiguities and confuses LLMs trying to infer context.

**Recommendation:** The spec must explicitly state that custom color tokens cannot be *any existing Igni keyword* (e.g., `theme`, `color`, `background`, `layout`, `label`, `if`, etc.). The reserved list must be global to the language, not just restricted to the 12 default colors. 

### Q3: Nested-group flattening — `_` separator vs alternatives
**The `_` flattening rule (`brand_border_subtle`) is exactly right.**
According to the "one way to do everything" principle, token resolution must be highly deterministic, lossless, and syntactically simple. 
*   **(a) Preserving the slash (`brand/border/subtle`)** violates the language's token-first, no-magic feel. Slashes imply directory paths or mathematical division. It would require lexer surgery just to support an edge case, breaking the rule that values should be standard identifiers.
*   **(b) Leaf-only (`subtle`)** is a non-starter. Real Figma files routinely have `brand/subtle`, `text/subtle`, and `border/subtle`. Leaf-only guarantees fatal collisions during translation.
*   **(c) First-and-leaf (`brand_subtle`)** loses intermediate context (`brand/background/subtle` vs `brand/border/subtle` still collide). 

Underscores natively map a tree structure to a flat namespace without losing data or requiring new syntax rules. Stick with `_`.

### Q4: Inline-hex same-cycle rejection
**Bundling the rejection in the same cycle is absolutely the right call.**
Igni is pre-v1.0 (v0.15.0). Historically not using deprecation cycles is a massive asset for a language aggressively optimizing for LLM learnability. 
*   If you introduce a deprecation warning, you must support *two valid syntaxes* for a cycle. This violently violates the "One way to do everything" principle.
*   More importantly, every codebase left alive with inline hex codes becomes polluted training data that teaches future LLMs the wrong way to write Igni. 
*   Given the audit confirmed 0 usages in the canonical examples, the blast radius is zero. Rip the band-aid off immediately.

### Q5: Blind spots — what's the design note missing?
There are two critical blind spots in this design note:

**1. The Figma Opacity / Alpha Channel mismatch (Fatal to Path C)**
The note specifies that hex strings use `"#RRGGBB"` syntax. It makes zero mention of alpha channels (`"#RRGGBBAA"`). Real Figma design systems rely heavily on opacity tokens (e.g., `scrim: "#00000080"`, `surface-hover: "#FFFFFF1A"`). If Igni strictly enforces a 6-character hex string, the Path C demo will fail the moment it encounters a transparent Figma variable. 
*   **Fix:** The v0.15.0 parser *must* support 8-character hex codes (`"#RRGGBBAA"`) and the codegen must be updated to emit the corresponding alpha values in `Color(0xAARRGGBB)` format. 

**2. The `card` background-only anomaly**
The note casually states: *"Plus `card` (background-only)... source code that uses `color: brand` or `background: card` continues to work."* And later: *"Net-new tokens are referenced the same way: `color: my_brand`, `background: primary_700`."*
This creates a massive logical inconsistency for the LLM and the user:
*   If `card` is defined under `theme: color: card: "#FFF"`, why is it restricted to `background:`? 
*   If I define a custom token `theme: color: surface_elevated`, is that *also* background-only? Or can I use it for text (`color: surface_elevated`)? 
*   If custom tokens can be used for *both* text and backgrounds, the legacy restriction on `card` is a "magic" exception that violates the language's core principles. 
*   **Fix:** Either drop the artificial "background-only" restriction on `card` (allowing `color: card`), or move `card` out of `theme: color:` entirely (e.g., to a future `theme: surface:`). Do not ship a system where custom colors behave differently than built-in ones.