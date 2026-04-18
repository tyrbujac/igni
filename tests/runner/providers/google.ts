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
    // Only include thinkingConfig when the caller set an explicit budget. Sending
    // `thinkingBudget: 0` unconditionally breaks Gemini 3.1 Pro, which requires
    // thinking mode ("Budget 0 is invalid. This model only works in thinking mode.").
    // When the flag is omitted, let Google's per-model defaults apply — older
    // Flash models default to no-thinking, thinking-capable models (3.1 Pro) opt
    // in automatically. Confirmed 2026-04-18 against the gemini-3.1-pro-preview
    // endpoint.
    const generationConfig: any = { maxOutputTokens: params.maxTokens };
    if (thinkingBudget > 0) {
      generationConfig.thinkingConfig = { thinkingBudget };
    }
    const model = this.client.getGenerativeModel({
      model: params.model,
      generationConfig,
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
