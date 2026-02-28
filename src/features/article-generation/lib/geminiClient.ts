import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-2.5-flash';

export interface GenerateTextOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

export interface GenerateTextResult {
  text: string;
  finishReason?: string;
}

export interface GeminiClient {
  generateText: (prompt: string, options?: GenerateTextOptions) => Promise<string>;
  generateTextResult: (
    prompt: string,
    options?: GenerateTextOptions,
  ) => Promise<GenerateTextResult>;
}

export function createGeminiClient(apiKey: string): GeminiClient {
  const ai = new GoogleGenAI({ apiKey });
  const requestTextResult = async (
    prompt: string,
    options?: GenerateTextOptions,
  ): Promise<GenerateTextResult> => {
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

    const finishReason = response.candidates?.[0]?.finishReason;
    return {
      text,
      finishReason,
    };
  };

  return {
    async generateTextResult(prompt: string, options?: GenerateTextOptions): Promise<GenerateTextResult> {
      return requestTextResult(prompt, options);
    },
    async generateText(prompt: string, options?: GenerateTextOptions): Promise<string> {
      const result = await requestTextResult(prompt, options);
      return result.text;
    },
  };
}
