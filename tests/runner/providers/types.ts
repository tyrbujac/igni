export type ProviderName = 'anthropic' | 'openai' | 'google' | 'ollama';

export type CallParams = {
  spec: string | null;
  prompt: string;
  model: string;
  maxTokens: number;
  thinkingBudget: number | null;
  effort: 'low' | 'medium' | 'high' | null;
};

export type ProviderUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens?: number;
  cache_read_tokens?: number;
  thinking_tokens?: number;
};

export type ProviderResult = {
  provider: ProviderName;
  requested_model: string;
  model_id: string;
  raw_output: string;
  usage: ProviderUsage;
  stop_reason: string;
  duration_ms: number;
};

export interface Provider {
  readonly name: ProviderName;
  call(params: CallParams): Promise<ProviderResult>;
}

export function inferProvider(model: string): ProviderName {
  const m = model.toLowerCase();
  if (m.startsWith('claude')) return 'anthropic';
  if (m.startsWith('gpt') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4')) return 'openai';
  if (m.startsWith('gemini')) return 'google';
  if (m.startsWith('gemma') || m.startsWith('llama') || m.startsWith('qwen') || m.startsWith('mistral') || m.startsWith('phi')) return 'ollama';
  throw new Error(`cannot infer provider from model "${model}"; pass --provider explicitly`);
}
