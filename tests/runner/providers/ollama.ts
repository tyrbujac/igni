import type { Provider, CallParams, ProviderResult } from './types.js';

type OllamaChatResponse = {
  model: string;
  message: { role: string; content: string };
  done: boolean;
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
};

export class OllamaProvider implements Provider {
  readonly name = 'ollama' as const;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  }

  async call(params: CallParams): Promise<ProviderResult> {
    const userContent = params.spec ? `${params.spec}\n\n${params.prompt}` : params.prompt;

    const started = Date.now();
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model,
        stream: false,
        messages: [{ role: 'user', content: userContent }],
        options: { num_predict: params.maxTokens },
      }),
    });
    const duration_ms = Date.now() - started;

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ollama call failed (${res.status}): ${text}`);
    }

    const body = (await res.json()) as OllamaChatResponse;

    return {
      provider: 'ollama',
      requested_model: params.model,
      model_id: body.model,
      raw_output: body.message?.content ?? '',
      stop_reason: body.done_reason ?? (body.done ? 'stop' : 'unknown'),
      duration_ms,
      usage: {
        input_tokens: body.prompt_eval_count ?? 0,
        output_tokens: body.eval_count ?? 0,
      },
    };
  }
}
