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
    const mustStream = !!params.effort || params.maxTokens > 8192;
    let raw_output = '';
    let model_id = params.model;
    let finish_reason: string = 'unknown';
    let usage_payload: any = null;
    if (mustStream) {
      const stream = await this.client.chat.completions.create({
        ...request,
        stream: true,
        stream_options: { include_usage: true },
      });
      for await (const chunk of stream) {
        if (chunk.model) model_id = chunk.model;
        const choice = chunk.choices?.[0];
        if (choice?.delta?.content) raw_output += choice.delta.content;
        if (choice?.finish_reason) finish_reason = choice.finish_reason;
        if ((chunk as any).usage) usage_payload = (chunk as any).usage;
      }
    } else {
      const response = await this.client.chat.completions.create(request);
      model_id = response.model;
      const choice = response.choices[0];
      raw_output = choice?.message?.content ?? '';
      finish_reason = choice?.finish_reason ?? 'unknown';
      usage_payload = response.usage;
    }
    const duration_ms = Date.now() - started;

    return {
      provider: 'openai',
      requested_model: params.model,
      model_id,
      raw_output,
      stop_reason: finish_reason,
      duration_ms,
      usage: {
        input_tokens: usage_payload?.prompt_tokens ?? 0,
        output_tokens: usage_payload?.completion_tokens ?? 0,
        cache_read_tokens: usage_payload?.prompt_tokens_details?.cached_tokens ?? 0,
      },
    };
  }
}
