# v0.17.0 cold-LLM rating + v1.0 readiness consult

Chat-mode (web UI) panel — *not* API runner. Run intent: mostly calibration, but worth saving in case the synthesis upgrades to dissertation-relevant. Five cells:

| # | Model | UI | Input |
|---|---|---|---|
| 1 | Claude (latest Opus / Sonnet visible at claude.ai) | claude.ai | `spec/v0.17.0-cheatsheet.md` |
| 2 | Claude (same model as #1) | claude.ai | `spec/v0.17.0.md` (full spec) |
| 3 | Gemini (latest at gemini.google.com) | Gemini | `spec/v0.17.0-cheatsheet.md` |
| 4 | Gemini (same as #3) | Gemini | `spec/v0.17.0.md` (full spec) |
| 5 | GPT (latest at chatgpt.com) | ChatGPT | `spec/v0.17.0-cheatsheet.md` *(context window — full spec not feasible)* |

The two-pass design for Claude / Gemini gives a within-model cheatsheet-vs-spec delta — what depth the cheatsheet under-teaches relative to the full spec.

## Prompt to paste (verbatim across all 5 cells, after pasting the input)

> Thoughts on this? Rate Igni out of 10 across these axes — and **for each axis briefly say what you mean by it before you score**, because several of these are ambiguous for a programming language:
>
> - **Readability** — for a designer-engineer reader (the canonical Igni user). Compare to other UI-DSL languages you know (Flutter, SwiftUI, Jetpack Compose, JSX, HTML/CSS) and anchor your score against at least one of them.
> - **LLM accuracy** — likelihood a frontier model writes correct Igni from this spec/cheatsheet alone, zero-shot. Anchor against your own confidence on writing Flutter or SwiftUI from their docs.
> - **Speed** — state which interpretation you're scoring (compile speed, runtime speed, developer iteration speed) before you score.
> - **Cost** — state which interpretation (token cost when an LLM generates Igni, cognitive cost for a human reader, hosting/runtime cost). Pick one or score multiple separately.
> - **Testing** — what test infrastructure could / should the language ship with? Score against what you'd expect from a v1.0 UI language.
> - Add any other axis you'd want to score on (accessibility? error messages? debugging? typing? extensibility?).
>
> Then: **before v1.0, what are the biggest things to consider?** Gaps, smells, structural risks, things you'd push back on, things you'd celebrate. Be substantive.
>
> Where you can, anchor scores with named comparators rather than abstract numbers.

## Capture protocol

For each cell, save the response as `<model>_<input-tier>.md` in this directory. Suggested filenames:

- `claude_cheatsheet.md`
- `claude_spec.md`
- `gemini_cheatsheet.md`
- `gemini_spec.md`
- `gpt_cheatsheet.md`

(Drop a model-version suffix if useful — `claude-opus-4-7_cheatsheet.md` etc. The exact label the UI displays on the day of the run is the audit-trail anchor since web models bump silently.)

**Frontmatter for each file** (paste at the top before the response body):

```markdown
---
model_label: <whatever the UI displays — e.g. "Claude Opus 4.7", "GPT-5", "Gemini 3.1 Pro">
input_tier: cheatsheet | spec
input_path: spec/v0.17.0-cheatsheet.md | spec/v0.17.0.md
date: 2026-04-27
---

[full pasted response]
```

`model_label` + `date` together are the only audit trail you'll have if you re-run later. Capture both even if they feel redundant — web UIs change models without notice.

## Synthesis (after all 5 cells captured)

Once outputs are back in this directory, paste a quick "I've captured all 5" note in chat and I'll write a synthesis README covering:

1. **Per-axis score table** — rows = axes, columns = the 5 cells. Numbers if given, qualitative position if not. Note divergent interpretations of the same axis (the "speed/cost" disambiguation often produces different scores from the same model under different framings).
2. **Convergence on critiques** — for the "biggest things before v1.0" half, count critiques appearing in 5/5, 4/5, 3/5 cells. 3+/5 enters ROADMAP Stream 3 as a candidate; single-cell critiques get logged but don't promote.
3. **Cheatsheet-vs-spec within-model delta** for Claude and Gemini — what appeared in the spec pass that didn't appear in the cheatsheet pass? Identifies depth gaps in the cheatsheet teaching.
4. **GPT cheatsheet-only blind spots** — anything Claude or Gemini's spec pass surfaced that no cheatsheet pass surfaced is a signal that the cheatsheet alone doesn't teach it. Worth flagging if load-bearing.
5. **Methodology verdict** — was 5 cells enough? Was the input-split worth the extra Claude/Gemini pass? Note for future runs.

No automatic ROADMAP / cheatsheet edits during synthesis — those are separate passes after you read the synthesis and decide.

## Notes on running

- **Open a fresh chat per cell** — no system prompt, no project context, no prior memory. Cold paste.
- **Order doesn't matter** — runs are independent.
- **If a model refuses** ("can't read this much" / "not sure what to evaluate") — capture that response as the cell output. Refusal is data.
- **If a model asks clarifying questions before answering** — answer minimally ("score on whatever interpretation you find most useful, and note the interpretation") and capture the resulting answer.
- **Don't iterate on the prompt mid-run.** If you spot a flaw, finish all 5 cells with the current prompt then run again with the revised one if it's worth it. Mid-run revision invalidates the panel.
