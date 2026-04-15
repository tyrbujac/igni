import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Provider, CallParams, ProviderResult } from './types.js';

export class GoogleProvider implements Provider {
  readonly name = 'google' as const;
  private client: GoogleGenerativeAI;

  constructor() {
    const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY not set');
    this.client = new GoogleGenerativeAI(key);
  }

  async call(params: CallParams): Promise<ProviderResult> {
    const userContent = params.spec ? `${params.spec}\n\n${params.prompt}` : params.prompt;
    const thinkingBudget = params.thinkingBudget && params.thinkingBudget > 0 ? params.thinkingBudget : 0;
    const model = this.client.getGenerativeModel({
      model: params.model,
      generationConfig: {
        maxOutputTokens: params.maxTokens,
        ...({ thinkingConfig: { thinkingBudget } } as any),
      },
    });

    const started = Date.now();
    const response = await model.generateContent(userContent);
    const duration_ms = Date.now() - started;

    const raw_output = response.response.text();
    const usage = response.response.usageMetadata;
    const finishReason = response.response.candidates?.[0]?.finishReason ?? 'unknown';

    return {
      provider: 'google',
      requested_model: params.model,
      model_id: params.model,
      raw_output,
      stop_reason: finishReason,
      duration_ms,
      usage: {
        input_tokens: usage?.promptTokenCount ?? 0,
        output_tokens: usage?.candidatesTokenCount ?? 0,
        cache_read_tokens: (usage as any)?.cachedContentTokenCount ?? 0,
      },
    };
  }
}
