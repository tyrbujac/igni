# Injection materials inventory — what to paste per chat session

## What goes into each chat (in order)

### 1. Cheatsheet (architectural reference)

**File:** `spec/v0.21.1-cheatsheet.md`
**Size:** ~8000 words / ~21k tokens (Anthropic) / ~14k tokens (OpenAI/Google)

Paste as the first message with framing:
> "Use this Igni cheatsheet as the architectural reference for the questions that follow. It defines the current canonical surface."

### 2. Brainstorm summary (operator's curated excerpt)

**Source:** `docs/private/134_v1_studio_brainstorm.md` (gitignored — operator-side document)
**What to extract:** The "Why this exists" + "7 operator brainstorm positions" sections. Cross-cutting observations are optional but help the panel see the position interrelations. Skip the "Routing note" (it's about what the panel does after — not relevant to the panel).

Paste as the second message with framing:
> "This is operator-side architectural brainstorm — exploration, not decisions. The questions below ask you to pressure-test these positions."

### 3. The 5 questions

**File:** `prompts.md` (this directory).

Two paste strategies (operator's call):
- **One-at-a-time:** paste Q1, get response, paste Q2, etc. Five separate model turns. Better for focused per-question reasoning; longer wallclock.
- **All-five-at-once:** paste all 5 questions in one message. Single model turn. Faster wallclock; risks model rushing later questions or pattern-matching across questions.

Either is acceptable; document which choice you used in the synthesis section of `README.md`.

## Per-model adaptation notes

- **Claude (Claude.ai):** large context handles all three injections (cheatsheet + brainstorm summary + questions) in one chat. Consider extended thinking if available.
- **GPT (ChatGPT):** large context handles it. GPT-5.5 if available; GPT-5.3 acceptable fallback (matches recent chat-mode panel models).
- **Gemini (Google AI Studio or Gemini chat):** Gemini 3.1 Pro preferred; 3 Flash as 4th-cell noise-tier comparison if operator wants.

## Output capture format

Save each model's responses verbatim into:
- `claude-opus-4-7.md`
- `gpt-5.5.md`
- `gemini-3.1-pro.md`

Per-file structure:
```markdown
# <Model name> — v1 Studio strategic critique

**Run date:** <date>
**Session shape:** one-at-a-time / all-five-at-once
**Cheatsheet version:** v0.21.1
**Brainstorm doc version:** docs/private/134 as of <date>

## Q1 — Wireframe vs semantic primitives split

**Verdict:** HOLD / REFINE / FLIP
**Confidence:** HIGH / MEDIUM / LOW

<verbatim model response>

## Q2 — Modular interactivity

...

(continue for Q3, Q4, Q5)
```

Verbatim means verbatim — don't trim, don't paraphrase, don't add operator commentary. Operator notes go in the per-question convergence table in the synthesis section of `README.md` after all three models complete.

## Cost tracking

Chat-mode = $0 monetary cost. Track operator-attention wallclock instead:
- Per-model session: ~20-30 min (longer than past chat-mode panels per architectural-question complexity).
- Total for 3 models: 60-90 min (sequential) or 30-45 min if running parallel browser tabs.
- Synthesis (3-model convergence per question + aggregate verdict + per-position v0.22+ scope-decision update): 60-90 min.
- **Total operator-attention: 2-3 hours.**
