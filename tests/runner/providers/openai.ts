import { createHash } from 'crypto';
import OpenAI from 'openai';
import type { Provider, CallParams, ProviderResult } from './types.js';

function specCacheKey(spec: string): string {
  return 'igni-spec-' + createHash('sha256').update(spec).digest('hex').slice(0, 16);
}

export class OpenAIProvider implements Provider {
  readonly name = 'openai' as const;
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    this.client = new OpenAI();
  }

  async call(params: CallParams): Promise<ProviderResult> {
    const userContent = params.spec ? `${params.spec}\n\n${params.prompt}` : params.prompt;

    const started = Date.now();
    const request: any = {
      model: params.model,
      max_completion_tokens: params.maxTokens,
      messages: [{ role: 'user', content: userContent }],
    };
    if (params.effort) request.reasoning_effort = params.effort;
    if (params.spec) request.prompt_cache_key = specCacheKey(params.spec);
    const response = await this.client.chat.completions.create(request);
    const duration_ms = Date.now() - started;

    const choice = response.choices[0];
    const raw_output = choice?.message?.content ?? '';

    return {
      provider: 'openai',
      requested_model: params.model,
      model_id: response.model,
      raw_output,
      stop_reason: choice?.finish_reason ?? 'unknown',
      duration_ms,
      usage: {
        input_tokens: response.usage?.prompt_tokens ?? 0,
        output_tokens: response.usage?.completion_tokens ?? 0,
        cache_read_tokens: (response.usage as any)?.prompt_tokens_details?.cached_tokens ?? 0,
      },
    };
  }
}
