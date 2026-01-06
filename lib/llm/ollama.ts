/**
 * Ollama LLM client
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b-instruct';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = OLLAMA_BASE_URL, model: string = OLLAMA_MODEL) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async chat(messages: OllamaMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: 0.3, // Lower temperature for more deterministic routing
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.message?.content || '';
    } catch (error) {
      console.error('Ollama chat error:', error);
      throw error;
    }
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: OllamaMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    return this.chat(messages);
  }
}

