import Anthropic from '@anthropic-ai/sdk';
import type { Provider, CallParams, ProviderResult } from './types.js';

export class AnthropicProvider implements Provider {
  readonly name = 'anthropic' as const;
  private client: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
    this.client = new Anthropic();
  }

  async call(params: CallParams): Promise<ProviderResult> {
    const content: Anthropic.TextBlockParam[] = [];
    if (params.spec) {
      content.push({ type: 'text', text: params.spec, cache_control: { type: 'ephemeral' } });
    }
    content.push({ type: 'text', text: params.prompt });

    const request: Anthropic.MessageCreateParamsNonStreaming = {
      model: params.model,
      max_tokens: params.maxTokens,
      messages: [{ role: 'user', content }],
    };

    const thinkingOn = !!(params.thinkingBudget && params.thinkingBudget > 0);
    if (thinkingOn) {
      const minMax = params.thinkingBudget! + 4096;
      if (request.max_tokens < minMax) {
        console.log(`      (max_tokens bumped ${request.max_tokens} → ${minMax} for thinking budget)`);
        request.max_tokens = minMax;
      }
      (request as any).thinking = { type: 'enabled', budget_tokens: params.thinkingBudget };
      request.temperature = 1;
    }

    const mustStream = thinkingOn || request.max_tokens > 8192;
    const started = Date.now();
    const response = mustStream
      ? await this.client.messages.stream(request).finalMessage()
      : await this.client.messages.create(request);
    const duration_ms = Date.now() - started;

    const raw_output = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    return {
      provider: 'anthropic',
      requested_model: params.model,
      model_id: response.model,
      raw_output,
      stop_reason: response.stop_reason ?? 'unknown',
      duration_ms,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_creation_tokens: (response.usage as any).cache_creation_input_tokens ?? 0,
        cache_read_tokens: (response.usage as any).cache_read_input_tokens ?? 0,
        thinking_tokens: (response.usage as any).thinking_output_tokens ?? 0,
      },
    };
  }
}
