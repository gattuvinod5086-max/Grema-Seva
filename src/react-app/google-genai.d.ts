declare module "@google/genai" {
  export interface GenerateContentConfig {
    maxOutputTokens?: number;
    temperature?: number;
    systemInstruction?: string;
  }

  export interface GenerateContentOptions {
    model: string;
    contents: string | unknown[];
    config?: GenerateContentConfig;
    systemInstruction?: string;
  }

  export class GoogleGenAI {
    constructor(options: { apiKey: string });
    models: {
      generateContent(options: GenerateContentOptions): Promise<{ text?: string }>;
    };
  }
}
