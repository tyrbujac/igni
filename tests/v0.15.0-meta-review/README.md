# v0.15.0 meta-review

Multi-model panel run on 2026-04-26 against the v0.15.0 ship state. Asks 4
frontier models for a structured Q1/Q2/Q3/Q4 review of three project
artefacts read together — the canonical spec, the agent-facing `CLAUDE.md`,
and the public `README.md`. Differs from a Stage 2 design panel (no design
note under critique) and from a Stage 3 ship-validation (no transpile to
grade). Closer in spirit to Stage 7 spec critique, but reads the project
*as a whole* rather than a single feature shipment.

## Method

- **Panel.** Default 4 models from `tests/runner/cold-test.ts`:
  `claude-opus-4-7`, `gpt-5.5`, `gemini-3.1-pro-preview`,
  `gemini-3.1-flash-lite-preview`.
- **Inputs.** Full `spec/v0.15.0.md`, `CLAUDE.md`, and `README.md` embedded
  inline in `prompt.md` between `---SPEC START/END---`,
  `---CLAUDE.MD START/END---`, `---README.MD START/END---` markers. No
  separate spec injection (`--no-spec`).
- **Grading.** None (`--no-grade`) — prose review, nothing to transpile.
- **Questions.** Q1 strengths · Q2 weaknesses · Q3 genuine semantic
  uncertainties · Q4 prioritised recommendations.

## Command

```bash
cd tests/runner
npx tsx cold-test.ts \
  --prompts ../v0.15.0-meta-review/prompt.md \
  --out ../v0.15.0-meta-review \
  --no-grade --no-spec
```

## Files

- `prompt.md` — the panel prompt with all three docs embedded.
- `internal-review.md` — Claude Code's own read of the codebase (Part A),
  written before reading the panel responses, then synthesised against the
  panel at the bottom.
- `{model}.md` × 4 — raw panel responses.
- `{model}.json` × 4 — per-cell metadata (cost, tokens, transpile=skipped).

## Status in the cycle

Tyr-initiated, not part of the standard Stage 0 → Stage 8 cycle. Reads at
the close of v0.15.0 ship rather than during a feature gate. Whether
findings escalate to a `docs/private/NN_*` design note is a Tyr decision
post-synthesis — see the *Synthesis* section at the bottom of
`internal-review.md` for the convergence-counted summary.
