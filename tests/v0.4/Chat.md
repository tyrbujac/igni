# Cold-LLM Test: Chat Interface (Igni v0.4)

**Spec version tested:** Igni v0.4
**Test run dates:** 2026-04-11 (all three models complete)
**Source prompt:** `prompts.md` → Chat interface

## The prompt

> Using only the Igni language spec above, write a chat interface in Igni. The screen should show a list of messages (each with a sender name and message text), have a text input at the bottom for typing new messages, and have a send button that adds the new message to the list and clears the input.
>
> Respond with only the Igni code — no explanation, no commentary, no discussion of the spec.

---

## Claude

**Model version:** Claude Opus 4.6
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen Chat:
  messages = []
  draft = ""

  layout vertical, padding: medium:
    each message in messages:
      MessageBubble message

    layout horizontal, gap: small:
      input bind: draft, placeholder: "Type a message"
      button "Send", color: brand, on tap: send()

  send():
    if draft is not empty:
      messages = messages + [{sender: "Tyr", text: draft}]
      draft = ""

component MessageBubble(message):
  layout vertical, padding: small:
    label message.sender, style: caption, color: subtle
    label message.text, style: body
```

### Grading

- **Invented syntax not in the spec?** **No.** Zero inventions.
- **Used existing syntax wrong?** **No.**
- **Valid Igni on first try?** **Yes.** Clean v0.4 throughout.
- **Line count:** ~19 lines.

### Notes

- **Extracted `MessageBubble` as a component** — cleanest decomposition, matches the v0.4 readability hint about preferring components for tappable/repeated rendering.
- **Used `draft = ""` to clear the input** — no invented `clear()` method, just reactive reassignment of the bound variable. The "predicted gap" about input clearing didn't materialize for this model.
- **Added `color: brand` styling** to the send button — minor stylistic flourish, fully valid.
- **Used `is not empty` for the empty check** — confirming the `is X` extension is now reflexive for Claude.
- **No scroll-to-bottom behaviour attempted** — Claude didn't try to invent a scroll primitive, just rendered the list normally. Treats scroll as out-of-scope.

---

## Gemini

**Model version:** Gemini Thinking 3.0
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen Chat:
  messages = [{sender: "System", text: "Welcome to Igni Chat v0.4"}]
  draft = ""

  layout vertical, gap: medium, padding: large:
    layout vertical, gap: medium:
      each msg in messages:
        MessageBubble msg

    layout horizontal, gap: small:
      input bind: draft, placeholder: "Type a message..."
      button "Send", on tap: send_message()

  send_message():
    if draft is not empty:
      messages = messages + [{sender: "Me", text: draft}]
      draft = ""

component MessageBubble(msg):
  layout vertical, gap: small:
    label msg.sender, style: caption, color: subtle
    label msg.text, style: body
```

### Grading

- **Invented syntax not in the spec?** **No.** Zero inventions.
- **Used existing syntax wrong?** **No.**
- **Valid Igni on first try?** **Yes.** Clean v0.4 throughout.
- **Line count:** ~22 lines.

### Notes

- **Initial system message** — Gemini seeded the messages list with `[{sender: "System", text: "Welcome to Igni Chat v0.4"}]`. Cute touch and demonstrates the object literal initialization pattern.
- **Extracted `MessageBubble` as a component** — same architectural choice as Claude, slightly different naming (`msg` vs `message`).
- **`is not empty` for the draft check** — Gemini has finally adopted the `is X` extension. This is the first test where Gemini didn't reach for `==`/`!=`. The v0.4 documentation of `is X` worked.
- **`draft = ""` to clear the input** — same as Claude, no invention.
- **No scroll-to-bottom behaviour** — same as Claude, treated as out-of-scope.

---

## GPT

**Model version:** ChatGPT (free tier, model version not displayed)
**Date:** 2026-04-11
**One-shot or split?:** One shot. No clarifying questions, no narration.

### Output

```igni
screen Chat:
  messages = []
  draft = ""

  layout vertical, gap: medium, padding: large:
    layout vertical, gap: small:
      each message in messages:
        layout vertical, gap: small:
          label message.sender, style: caption, color: subtle
          label message.text, style: body

    layout horizontal, gap: small:
      input bind: draft, placeholder: "Type a message"
      button "Send", on tap: send_message()

  send_message():
    if draft is not empty:
      messages = messages + [{sender: "You", text: draft}]
      draft = ""
```

### Grading

- **Invented syntax not in the spec?** **No.** Zero inventions.
- **Used existing syntax wrong?** **No.**
- **Valid Igni on first try?** **Yes.** Clean v0.4 throughout.
- **Line count:** ~17 lines (the most compact of the three).

### Notes

- **Inlined message rendering** instead of extracting a `MessageBubble` component. Both styles are valid — the v0.4 readability hint *prefers* extraction but doesn't require it. ChatGPT picked the more compact form.
- **Nested `layout vertical` inside `each`** to give each message its own visual block. Adds depth but stays well within the 4-level limit (screen → layout → layout → each → layout = depth 3 since `each` doesn't count).
- **`is not empty` for the draft check** — same as the other two models. Universal across all three.
- **`draft = ""` to clear** — same as the other two.
- **No scroll-to-bottom attempted** — same as the other two.

---

## Gaps observed (across all three models)

**Zero gaps across all three models.** This is the first test in the suite to produce a 100% clean PASS.

### The cross-model gap matrix (Chat)

| Concern | Claude Opus 4.6 | Gemini Thinking 3.0 | ChatGPT (free) |
|---|---|---|---|
| Invented syntax | None | None | None |
| Used existing wrong | None | None | None |
| Valid first try | Yes | Yes | Yes |
| Used `is not empty` | Yes | **Yes (first time for Gemini)** | Yes |
| Cleared input via `draft = ""` | Yes | Yes | Yes |
| Extracted MessageBubble component | Yes | Yes | No (inlined) |
| Attempted scroll-to-bottom | No | No | No |

### Predicted gaps that did NOT surface

- **Clearing an input programmatically.** All three models converged on `draft = ""` — the simple reactive approach. The predicted gap was based on the assumption that models might invent a `controller.clear()` method, but with `bind` being two-way and reactivity being lexical, reassignment is the obvious answer. Not a gap.
- **Scroll-to-bottom behaviour.** None of the three attempted to add scroll behaviour. This is technically still a missing feature (real chat apps need it), but it didn't manifest as an *invented gap* — models treated it as out-of-scope rather than reaching for a fictional primitive. Worth noting as a v0.5 feature consideration but not a v0.4 defect.

### What this confirms about v0.4

- **The `is X` extension has now landed for all three models.** Gemini was the holdout in Calculator and Todo (consistently invented `==`/`!=`), but in Chat it used `is not empty`. The v0.4 documentation of `is X` for arbitrary equality successfully captured Gemini's preference. This is a strong validation signal — v0.4 closed the equality gap empirically, not just theoretically.
- **Reactive input clearing is discoverable.** All three models found `draft = ""` without help. The two-way `bind` model is genuinely intuitive once you understand it.
- **Component extraction is encouraged but not enforced.** 2/3 models extracted `MessageBubble`, 1/3 inlined. Both forms are valid v0.4. The readability hint nudges without coercing — exactly the right balance.

---

## v0.4 acceptance verdict

**PASS.** All three models produced valid Igni first-try with zero inventions. v0.4 covers the chat-app use case fully. The chat-specific predicted gaps (input clearing, scroll-to-bottom) either resolved themselves through existing reactive primitives (clearing) or were treated as out-of-scope by all models (scroll).

This is the **first 100% clean test in the suite.** Calculator, Todo, and Weather all had at least one universal invention (arithmetic, list operations, `null`). Chat is the first to validate v0.4 cleanly.

**Implication:** v0.4 is genuinely shipping-ready for the kinds of apps the test suite covers. The remaining acceptance tests (Music player and Notes) will tell us whether that ship-readiness extends to the harder cases.

---

## Hand-written attempt (optional but valuable)

Your own attempt at this app in Igni, with `# GAP:` comments where you hit walls.

```igni
(paste your hand-written attempt here)
```
