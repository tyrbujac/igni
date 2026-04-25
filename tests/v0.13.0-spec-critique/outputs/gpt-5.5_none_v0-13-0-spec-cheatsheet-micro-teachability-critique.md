## 1 — Composition rules clarity

The rules are broadly clear, and rules 1–3 are especially good because they separate the three common cases: no `fill: true`, fill with parent wider than cap, and fill with parent narrower than cap. The “parent wider than cap” rule also usefully says that leftover space is not magically consumed by the capped layout; placement is controlled by the parent’s `align:`.

Rule 4 is understandable in spirit, but I would tighten it. “Remaining space is redistributed proportionally among uncapped `fill: true` siblings” leaves a small but real question: proportional to what? Igni currently has only boolean `fill: true`, not numeric flex weights, so all participating siblings effectively have equal weight. The spec should probably say that explicitly: all `fill: true` siblings have weight 1; capped siblings freeze when they reach their cap; the remaining available width is split equally among the remaining unfrozen `fill: true` siblings. If multiple capped siblings hit their caps at the same time, they freeze together.

That one clarification would make the rule understandable even to someone who has never seen Flutter or CSS flexbox. The current wording is close, but “proportionally” imports a flexbox mental model and may make readers wonder whether hidden weights exist.

I would also consider clarifying that rule 4 is about width distribution among siblings in a horizontal space-allocation context. Since `max_width:` is width-only, the multi-sibling splitting behavior is most relevant for horizontal layouts; in a vertical stack, siblings are not usually splitting horizontal space with one another in the same way.

## 2 — Box-model rule

Rule 5 is communicated well. The phrase “caps the outer rendered layout box, including padding and background” is the key sentence, and the explicit arithmetic example — 480px outer, 24px padding on each side, 432px inner — is exactly the right kind of anti-ambiguity note.

I do think the arithmetic is clear enough for most readers to trace. It directly prevents the common misunderstanding that `max_width: phone` means “content area is 480px.” The CSS `box-sizing: border-box` comparison is also useful for web-experienced readers.

If you wanted to make it even more bulletproof, you could add a short formula-style sentence: inner content width = capped outer width minus left padding minus right padding. That would help readers generalize beyond `padding: large`. But the existing text is already strong; I would not consider this a spec hole.

One minor edge: if the parent is narrower than the cap and `fill: true` applies, then the same border-box logic presumably means outer width equals the parent’s available width and inner width subtracts padding from that. That follows from rules 3 and 5 together, but an implementation-oriented reader might appreciate the implied combination being made explicit somewhere.

## 3 — Cheatsheet density

The cheatsheet paragraph is sufficient for the simple mental model: `max_width:` has three tokens, omission means uncapped, numeric values are invalid, and padding is included. That is a lot of value in one compact paragraph.

However, I would lean toward adding a second very small example or scan-friendly note for `fill: true` composition, because that is where the complexity lives. The current example shows the happy path of a capped card, but it does not demonstrate the behavior that required five rules in the full spec. Since Igni is explicitly optimized for LLM accuracy as well as human readability, examples matter: an LLM is much less likely to invent `max_width: full` or mis-handle capped fill siblings if it has seen the canonical composition pattern.

That said, the density cost is real. I would not add a large example. A compact two-sibling horizontal layout example, or even a short “pattern” line explaining “capped fill child freezes; other fill child grows,” would probably pay for itself. If the cheatsheet must remain extremely tight, the current paragraph is acceptable, but it compresses the hardest behavior into one sentence.

## 4 — Micro and the absent `full` token

The micro’s “omit for uncapped (no `full` token)” is good, but I do not think it fully closes the hallucination surface. Web/CSS-trained readers and LLMs may still guess `max_width: none`, `max_width: auto`, or `max_width: 100%`, especially because the property name resembles CSS.

Given Igni’s “one way to do everything” and token-first philosophy, I would spend the extra few words in the micro: “omit for uncapped; no `full`/`none`/`auto`.” That is a small token cost with high defensive value. The full spec already says not to introduce `none` or `full`, but the micro is likely to be read in isolation or used as a compressed prompt artifact. It should explicitly kill the most likely aliases.

So: the hint lands, but it could land harder.

## 5 — Anything else

The biggest thing that caught my eye is possible `align: center` ambiguity in the examples, especially the micro text “Capped at 480px, centered.” In the full spec’s rule 2, final placement of the capped layout follows the parent’s `align:`. But the examples put `align: center` on the capped layout itself. Depending on Igni’s layout model, that likely centers the layout’s children inside the capped layout, not the capped layout inside its parent. A cold reader could easily infer that `align: center` on the same layout centers the capped box in the available parent width.

If that inference is wrong, the examples should be adjusted or annotated. For example, the micro sentence could say “children centered” rather than “centered,” or the spec could include a parent layout example where the parent’s `align: center` is responsible for placing the capped child. This matters because `max_width:` is often used specifically for centered content columns, and the difference between self-alignment and child alignment is a common source of UI bugs.

Second, the cheatsheet says “pick the nearest token.” That is understandable, but it slightly undermines the token-first design philosophy by encouraging numeric nearest-neighbor thinking. The full spec’s wording — pick `phone` or `tablet` and accept the substitution — is better. Maybe say “pick the closest intended token” or simply “choose one of the available tokens; exact pixel caps are invalid.” Otherwise an LLM may compute nearest numeric token when semantic intent should dominate.

Third, “shrink-wraps to its content’s intrinsic width” is mostly clear, but intrinsic width can become complicated with long labels, wrapping text, images, or children that themselves fill. The spec probably does not need to solve all of text layout here, but it may be worth stating the effective formula for the simple case: without `fill: true`, outer width is the content’s intrinsic outer width, capped by `max_width:`. If content cannot fit inside the cap, wrapping/overflow follows the child’s normal rules. That would avoid readers wondering whether `max_width:` forces wrapping, clips overflow, or changes intrinsic measurement.

Overall, the artifacts are directionally strong. The token set is crisp, omission-as-uncapped is correctly emphasized, numeric values are rejected, and the border-box rule is well explained. The main improvements I would make are: clarify rule 4’s equal-weight redistribution, strengthen the micro against `none`/`auto`, and fix or annotate the `align: center` examples so readers do not confuse centering children with centering the capped layout itself.