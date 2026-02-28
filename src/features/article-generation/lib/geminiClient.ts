import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-2.5-flash';

export interface GenerateTextOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

export interface GeminiClient {
  generateText: (prompt: string, options?: GenerateTextOptions) => Promise<string>;
}

export function createGeminiClient(apiKey: string): GeminiClient {
  const ai = new GoogleGenAI({ apiKey });

  return {
    async generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          temperature: options?.temperature,
          maxOutputTokens: options?.maxOutputTokens,
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error('モデルの応答が空でした。');
      }

      return text;
    },
  };
}
