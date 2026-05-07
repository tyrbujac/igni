# Injection materials — what to paste per chat session

## What goes into each chat (in order)

### 1. Elided cheatsheet excerpt + Studio mock + frame (single paste, ~600 words)

Paste the block below as the first message with this framing line:

> "You're being asked to design a size-token scale for a UI-first DSL named Igni. The excerpt below shows the **shape** of the scale (uses + structure) but with all token names elided. Read it, then answer the question that follows."

---

### Cheatsheet excerpt (spec/v0.21.2-cheatsheet.md §"Spacing tokens", **token names elided**)

```
### Spacing tokens

Two equivalent surfaces — pick whichever reads cleanly in context:

- **Word tokens (semantic shortcuts)** — `<token_A>` (8 px), `<token_B>` (16 px), `<token_C>` (24 px).
- **Numeric scale (whitelisted)** — `<scale/1>` (4 px), `<scale/2>` (8 px), `<scale/3>` (12 px), `<scale/4>` (16 px), `<scale/5>` (20 px), `<scale/6>` (24 px), `<scale/8>` (32 px). The scale is **sparse**: `<scale/7>` (28 px) is **not** valid, and there's no escape hatch to arbitrary pixel values. Tailwind users coming in will reach for `<scale/7>` or `<scale/12>`; both are parse-time errors. The seven listed tokens are the complete set.

`<token_A>` = `<scale/2>`. `<token_B>` = `<scale/4>`. `<token_C>` = `<scale/6>`. Same effect either way. Empirical heuristic for which to reach for: numeric `<scale/N>` for specific pixel values (especially 12 / 20 / 4 / 32 px which lack word-token aliases — common when translating from a Figma spec); word tokens for semantic shorthand (e.g. "a moderate gap between cards in a list," where the exact pixel value is incidental).

Used by `gap:`, `padding:`, `rounded:`, and `size:` properties. Numeric `gap: 12` is **not** valid — token-only discipline preserved.

# Example (numeric)
layout vertical, padding: <scale/3>, gap: <scale/2>:
  label "12 px outer padding, 8 px between rows"

# Example (equivalent, word tokens)
layout vertical, padding: <token_B>, gap: <token_A>:
  label "16 px outer padding, 8 px between rows"
```

### Studio Properties panel mock (token labels stripped)

The same scale powers the segmented controls in Igni Studio's Properties panel. Each row is one property; each button is one token-value. Labels are stripped to `?` so you don't pattern-match on familiar abbreviations:

```
ROUNDED
[ ? │ ? │ ? │ ? │ ? │ ? ]

PADDING
[ ? │ ? │ ? │ ? │ ? │ ? ]

GAP
[ ? │ ? │ ? │ ? │ ? │ ? ]

SIZE
[ ? │ ? │ ? │ ? │ ? │ ? ]
```

When a user clicks a button, the corresponding token writes into the source. If you propose a token labelled `[YourTokenName]`, clicking that button on `PADDING` writes `padding: <your_token_name>` into the Igni source visible in the Code panel beside it. The **same token name** appears both as the button label AND in source — it must read natively in both surfaces.

### Designer-lean frame

The canonical Igni user is a Figma-background designer + LLM pair authoring Igni source from a Figma design. Lean toward what reads natively in a **design panel** (Figma / Sketch / Adobe XD aesthetic) — not what reads natively as a **Tailwind class** (`sm` / `md` / `lg` are abbreviations native to utility-CSS, not to design tools).

Counter-frame the training distribution. Frontier models have seen `sm` / `md` / `lg` thousands of times in Tailwind training data; that does NOT automatically make them right for a designer-leaning DSL. Treat the Tailwind defaults as one option among many, not the baseline.

---

### 2. The question

After the model acknowledges the cheatsheet excerpt, paste the contents of `prompts.md` as the second message.

Two paste strategies (operator's call):
- **Two-message:** paste injection materials, wait for ack, paste the question. Cleaner per-step focus.
- **One-message:** paste both at once. Faster wallclock; risks model conflating the cheatsheet with the question framing.

Either is acceptable; document which you used in the per-cell file's `Session shape` field.

## Per-model adaptation notes

- **Claude (Claude.ai):** large context handles both injections in one chat. Consider extended thinking if available.
- **GPT (ChatGPT):** large context handles it. GPT-5.3 Pro preferred (Pro tier for reasoning; Plus tier acceptable fallback per chat-mode panel precedent).
- **Gemini (Google AI Studio or Gemini chat):** Gemini 3.1 Pro preferred; 3 Flash as 4th-cell noise-tier comparison if operator wants.

## Output capture format

Save each model's response verbatim into the per-cell file (`claude-opus-4-7.md` etc.). Each placeholder file has the header structure pre-filled — just paste the response below the marker.

Verbatim means verbatim. Don't trim, don't paraphrase, don't add operator commentary. Operator notes go in the synthesis section of `README.md` after all cells complete.

## Operator pre-flight check (recommended)

Before pasting, run this grep against `injection-materials.md` to confirm no canonical or drift names leak into the prompt:

```bash
grep -nE '\b(small|medium|large|sm|md|lg|xl|xs|none|full|pill)\b' tests/v0.22-size-tokens-panel/injection-materials.md
```

Expected: zero matches in size-token-value contexts (matches inside this prose section — like the designer-lean frame disclaiming Tailwind — are fine; the operator pastes only the cheatsheet excerpt + Studio mock + designer-lean frame, which contain no canonical or drift token names).
