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
  // Anthropic — Opus tier historically $15/$75, cache write 1.25x input, read 0.10x input
  'claude-opus-4-7': {
    input: 15,
    output: 75,
    cache_write: 18.75,
    cache_read: 1.5,
  }, // VERIFY

  // OpenAI — key must match exact model_id returned by the API (includes checkpoint date)
  'gpt-5.4-2026-03-05': {
    input: 0,
    output: 0,
  }, // VERIFY — fill in current GPT-5.4 pricing

  // Google
  'gemini-3-flash-preview': {
    input: 0,
    output: 0,
    cache_read: 0,
  }, // VERIFY — fill in current Gemini 3 Flash pricing

  // Ollama — local inference, no per-token cost. Key is the exact model tag (colon preserved).
  'gemma4:e4b': { input: 0, output: 0 },
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
