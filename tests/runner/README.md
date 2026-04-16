# Igni Test Runner

API-based cold-test driver for four providers. Replaces the manual "paste spec into chat UI" loop, producing structured result files with real token counts, pinned model checkpoints, and an automatic transpiler grade.

**Status: Phase 1 complete.** 12 cells executed across 4 models × 3 prompts; raw results at `tests/v0.8.1/outputs/`, graded write-ups at `tests/v0.8.1/Habit_Tracker.md`, `Spec_Comprehension.md`, `BMI_Negative_Control.md`. This runner is the canonical cold-test path for v0.8.1+.

**Supported providers (all live):**

| Provider | Transport | Env var | Example model ID |
|---|---|---|---|
| Anthropic | Official SDK | `ANTHROPIC_API_KEY` | `claude-opus-4-7` |
| OpenAI | Official SDK | `OPENAI_API_KEY` | `gpt-5.4` |
| Google | Official SDK (`@google/generative-ai`) | `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) | `gemini-3-flash-preview` |
| Ollama | HTTP `POST /api/chat` | `OLLAMA_URL` (default `http://localhost:11434`) | `gemma4:e4b` |

Provider is inferred from the model ID prefix. Use `--provider` to override.

Keys live in `.env` (copy `.env.example`, fill in). The runner auto-loads `.env` via `process.loadEnvFile` — no per-session `export` needed.

## Install

```bash
cd tests/runner
npm install
```

Ollama also needs a running daemon (`ollama serve`) with the target model pulled (`ollama pull gemma4:e4b`).

## Run

Anthropic with full spec:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npx tsx run.ts \
  --model claude-opus-4-7 \
  --spec ../../spec/v0.9.0.md \
  --prompts ../v0.8.1/prompts.md \
  --out ../v0.8.1/outputs
```

OpenAI with cheatsheet:

```bash
export OPENAI_API_KEY=sk-...
npx tsx run.ts \
  --model gpt-5.4 \
  --spec ../../spec/v0.8.0-cheatsheet.md \
  --prompts ../v0.8.1/prompts.md \
  --out ../v0.8.1/outputs
```

Google with micro (Gemini 3 Flash preview):

```bash
npx tsx run.ts \
  --model gemini-3-flash-preview \
  --spec ../../spec/v0.8.0-micro.md \
  --prompts ../v0.8.1/prompts.md \
  --out ../v0.8.1/outputs
```

Note: Gemini 3 family models are currently in preview. Free tier hit 503 rate-limits during Phase 1; billing-enabled projects are stable. `gemini-3-pro-preview` is available too. `gemini-flash-latest` is a safe GA fallback.

Ollama locally (no API key needed):

```bash
npx tsx run.ts \
  --model gemma4:e4b \
  --spec ../../spec/v0.8.0-cheatsheet.md \
  --prompts ../v0.8.1/prompts.md \
  --out ../v0.8.1/outputs
```

Negative control (no spec sent):

```bash
npx tsx run.ts \
  --model claude-opus-4-7 \
  --prompts ../v0.8.1/prompts-control.md \
  --out ../v0.8.1/outputs
```

Run just one prompt:

```bash
npx tsx run.ts --model claude-opus-4-7 --spec ... --prompts ... --out ... --prompt 1
```

Preview parsing without spending tokens:

```bash
npx tsx run.ts --dry-run --model claude-opus-4-7 --prompts ../v0.8.1/prompts.md --out ../v0.8.1/outputs
```

## What it does

1. Parses `## N. Title` sections from the prompts file; the first blockquote in each section is the prompt sent to the model. Grading prose outside the blockquote is ignored.
2. For each prompt, builds a single user message. When `--spec` is given, the spec and prompt are two separate content blocks (Anthropic: with `cache_control: ephemeral` for cache reuse; other providers: concatenated with a blank line).
3. Dispatches to the provider inferred from the model ID (or `--provider` override).
4. **Auto-grade (default on):** extracts the first `\`\`\`igni` (or `\`\`\``) fenced block from the response and pipes it through `transpiler/src/cli.ts`. Records pass/fail + stderr snippet + Igni line count.
5. Writes two files per prompt: `<model>_<tier>_<slug>.md` (raw output) and `<model>_<tier>_<slug>.json` (metadata including the transpile result).

## Output file naming

```text
<model-slug>_<spec-tier>_<prompt-slug>.{md,json}
```

- `model-slug` — sanitised model ID (e.g. `claude-opus-4-7`, `gemini-3-flash`, `gemma4-e4b`)
- `spec-tier` — `full`, `cheatsheet`, `micro`, or `none` (inferred from the spec filename; `none` when no spec)
- `prompt-slug` — kebab-case prompt title (e.g. `habit-tracker`, `spec-comprehension`, `bmi-calculator`)

Example: `claude-opus-4-7_cheatsheet_habit-tracker.json`

## Result JSON schema

```json
{
  "provider": "anthropic",
  "requested_model": "claude-opus-4-7",
  "model_id": "claude-opus-4-7-<checkpoint-date>",
  "prompt_name": "Habit Tracker",
  "prompt_slug": "habit-tracker",
  "prompt_index": 1,
  "prompt_path": "/abs/.../prompts.md",
  "spec_path": "/abs/.../spec/v0.8.0-cheatsheet.md",
  "spec_tier": "cheatsheet",
  "spec_sha256": "…",
  "spec_words": 1780,
  "timestamp": "2026-04-15T20:00:00.000Z",
  "duration_ms": 14321,
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 2300,
    "output_tokens": 1150,
    "cache_creation_tokens": 2300,
    "cache_read_tokens": 0
  },
  "transpile": {
    "attempted": true,
    "extracted_code": true,
    "passed": true,
    "error": null,
    "igni_lines": 78
  }
}
```

**Fields by provider — what to expect:**

- All four populate `input_tokens`, `output_tokens`, `duration_ms`, and the raw output.
- `cache_creation_tokens` / `cache_read_tokens` are only meaningful for Anthropic (ephemeral caching) and partially for OpenAI (prompt-cache hits). Google and Ollama leave these as 0 / undefined.
- `model_id` is the exact checkpoint returned by the API for Anthropic and OpenAI. Google and Ollama echo the requested model back (no server-side versioning exposed).
- `transpile.passed` is `null` when `--no-grade` is passed or no fenced code block is found.

## Extended thinking (Anthropic)

Claude Opus 4.7 and Sonnet 4.6+ support extended thinking — a visible "reasoning budget" the model spends before writing its final answer. Opt in via `--thinking <n>`:

```bash
npx tsx run.ts \
  --model claude-opus-4-7 \
  --thinking 10000 \
  --spec ../../spec/v0.8.0-cheatsheet.md \
  --prompts ../v0.8.1/prompts.md \
  --out ../v0.8.1/outputs
```

**Suggested budgets (Phase 1 calibrated):**
- `5000` — **default for regression testing.** Same-spec same-prompt regression doesn't need deep reasoning; 5k captures code-correctness signal at ~40% lower cost than 10k.
- `10000` — flagship dataset runs that go into the dissertation chart. Gives Opus the full reasoning envelope for a cleaner peer-to-peer comparison.
- `16000+` — only when `stop_reason == "max_tokens"` actually appears. Rare for UI-code tasks.

Phase 1 experience: at 10k, Opus spent most of the headroom on the *design-decisions commentary* that follows the code, not on making the code itself better. The Habit Tracker code at 10k is essentially identical in quality to what 5k would have produced. Reserve 10k for rounds where reviewer-facing prose matters.

**Behaviour:**
- Thinking forces `temperature: 1` (Anthropic API requirement).
- `max_tokens` auto-bumps to `thinkingBudget + 4096` if the budget would starve output.
- Thinking tokens count as *output* for billing purposes. At Opus prices (~$75/MTok out), 10k thinking is ~$0.75 per call on top of the normal answer.
- The `.md` result file contains **only the model's final text** — thinking blocks are filtered out (private scratchpad).
- `usage.thinking_tokens` in the JSON is best-effort — SDK 0.60 doesn't expose a separate breakdown, so the field is 0 even when thinking ran. The elevated `output_tokens` and `duration_ms` are the signal that thinking fired.

**Non-Anthropic providers:** silently ignore the flag. OpenAI reasoning models (`o1`, `o3`) and Gemini thinking are a planned follow-up, not wired up yet.

**Context:** Opus 4.7's default context window is 200k tokens (a 1M-context variant also exists — see Anthropic docs for that model ID). No flag needed for 200k — the full spec (9,700 words ≈ 12,600 tokens) fits comfortably.

## Phase 1 — complete

Pipeline validated end-to-end against four models on three prompts (Habit Tracker on cheatsheet, Spec Comprehension on micro, BMI Calculator with no spec as negative control). 12 cells, 24 result files at `tests/v0.8.1/outputs/`.

**Key findings from Phase 1 (full write-ups at `tests/v0.8.1/Habit_Tracker.md`, `Spec_Comprehension.md`, `BMI_Negative_Control.md`):**

- **`emit toggle` — 2/4 model convergence.** Claude Opus 4.6 and Gemini 3 Flash both independently chose `toggle` as the natural name for a completion event on Habit Tracker. Both were rejected by the transpiler. Spec's reserved list is `tap|change|touch`; the transpiler additionally blocks primitive names. Transpiler-vs-spec gap — strongest signal of the round.
- **Opus "honest no" in the negative control.** Only Opus flagged that Igni isn't in its training data before attempting a best-guess implementation. The other three models confabulated silently. This is the methodology-gold diagnostic output.
- **Model-specific drift direction** in the no-spec runs: Opus → SwiftUI, GPT-5.4 → JavaScript (`?:` ternaries), Gemini 3 → Rust (`fn view(&self) -> Node`), Gemma → Kotlin/Swift. Useful baseline: every spec-effect claim should compare against these drifts as the "what the model brings before reading the spec" denominator.
- **0/4 transpile rate on the Habit Tracker**, but Opus's output and Gemini 3's output were both v0.8.0-valid code blocked only by the transpiler. A Phase 2 transpiler-fix round could flip this to 2/4.

Going forward every new spec version should re-run these three prompts against the same four models. JSON-to-JSON diffs between version folders produce the Phase 5 regression chart automatically.

## Follow-ups (not in Phase 1)

- Batch mode: `--models <csv>` runs N models over the same prompts in one invocation.
- Parametric spec-size sweep: `--spec-tier all` runs full + cheatsheet + micro, same model, same prompts.
- Repeats: `--reps 3` for measuring variance when `temperature > 0`.
- `dart analyze` layer on top of the transpile grade — catches Dart-level issues the transpiler's parser doesn't.
- Results summariser — CLI that reads an `outputs/` directory and prints a grading table across models and spec tiers.
