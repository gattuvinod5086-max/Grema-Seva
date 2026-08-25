/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Stub for @google/genai when the package is not installed.
 * Build succeeds without node_modules/@google/genai.
 * Install with: npm install @google/genai
 */

const STUB_MESSAGE =
  "AI is not available. Install the package (npm install @google/genai) and set VITE_GEMINI_API_KEY in .env to enable Vikas Sahayak and Krishi Terminal.";

export class GoogleGenAI {
  constructor(_: { apiKey: string }) {}
  models = {
    generateContent: async (_: unknown): Promise<{ text?: string }> => ({
      text: STUB_MESSAGE,
    }),
  };
}
