import type { ProviderUsage } from './types.js';

export type Pricing = {
  input: number;
  output: number;
  cache_write?: number;
  cache_read?: number;
};

// Rates in USD per 1,000,000 tokens. Keyed by exact model_id returned by the
// provider (not the requested alias). Add new models here as they land in
// test runs. Entries marked `VERIFY` are best-effort starting points — confirm
// against the provider's current pricing page before treating cost_usd as
// authoritative in published results.
export const PRICING: Record<string, Pricing> = {
  // Anthropic — Opus 4.7 (1M context). Input/output sourced 2026-04-18 from
  // anthropic.com pricing page. Cache rates derived from the historical
  // 1.25x/0.10x-of-input ratios; re-verify against the current pricing page
  // before any cache-heavy cost figure enters the dissertation.
  'claude-opus-4-7': {
    input: 5,
    output: 25,
    cache_write: 6.25,
    cache_read: 0.5,
  },

  // Opus 4.6 — same rate card as 4.7 per Anthropic pricing page.
  'claude-opus-4-6': {
    input: 5,
    output: 25,
    cache_write: 6.25,
    cache_read: 0.5,
  },

  // OpenAI — sourced 2026-04-18 from the openai.com pricing page (GPT-5.4 entry).
  // Key must match exact model_id returned by the API (includes checkpoint date).
  'gpt-5.4-2026-03-05': {
    input: 2.5,
    output: 15,
    cache_read: 0.25,
  },

  // Google — sourced 2026-04-18 from https://ai.google.dev/gemini-api/docs/pricing
  // Text/image/video rate (audio input is $1.00 but we don't send audio).
  'gemini-3-flash-preview': {
    input: 0.5,
    output: 3,
    cache_read: 0.05,
  },

  // Google — Gemini 3.1 Pro Preview. Input/output rates from the same pricing
  // page. Cache rate not separately disclosed for 3.1 Pro preview at time of
  // entry — computeCost falls back to the input rate, which slightly overstates
  // cache cost. Verify against the pricing page before any cache-heavy claim.
  'gemini-3.1-pro-preview': {
    input: 2,
    output: 12,
  },

  // Google — Gemini 3.1 Flash-Lite Preview. Cheapest entry in the panel by ~20x
  // vs Opus on output; load-bearing for the dissertation's cost-ratio exhibit
  // once v0.11 post-fix reruns use this as the "cheap frontier-adjacent" model.
  'gemini-3.1-flash-lite-preview': {
    input: 0.25,
    output: 1.5,
  },

  // Ollama — local inference, no per-token cost. Key is the exact model tag (colon preserved).
  'gemma4:e4b': { input: 0, output: 0 },
};

// Pinned model-id expectations per requested alias. When a provider returns a
// versioned/dated `model_id` (OpenAI does; Anthropic and Google typically echo
// the requested alias), pinning catches silent endpoint swaps — especially
// important for the Google preview-status models where Google may change the
// endpoint behind a preview alias without bumping the name.
//
// Entries are opt-in: aliases without a pin are not checked. The runner fails
// loudly (exit non-zero) if a pinned alias returns a different model_id.
export const MODEL_PINS: Record<string, string> = {
  // OpenAI — echoing the requested model; checkpoint date appears on model_id.
  'gpt-5.4': 'gpt-5.4-2026-03-05',

  // Google — Google's SDK currently echoes the requested model back as model_id,
  // so these pin to self. If that behaviour changes (e.g. Google starts
  // returning a dated checkpoint), the assertion catches it.
  'gemini-3-flash-preview': 'gemini-3-flash-preview',
  'gemini-3.1-pro-preview': 'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite-preview': 'gemini-3.1-flash-lite-preview',
};

export function computeCost(modelId: string, usage: ProviderUsage): number | null {
  const p = PRICING[modelId];
  if (!p) return null;
  const cacheWrite = p.cache_write ?? p.input;
  const cacheRead = p.cache_read ?? p.input;
  const cost =
    usage.input_tokens * p.input +
    usage.output_tokens * p.output +
    (usage.cache_creation_tokens ?? 0) * cacheWrite +
    (usage.cache_read_tokens ?? 0) * cacheRead;
  return cost / 1_000_000;
}
