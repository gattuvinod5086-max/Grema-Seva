import { useCallback, useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { getSchemeSummary } from "@/react-app/data/schemes";

const VIKAS_SAHAYAK_SYSTEM = `You are "Vikas Sahayak," the official AI assistant for the Grama Seva – Digital Telangana Terminal. You serve citizens of Telangana with a professional, empathetic, and informative tone.

You have deep knowledge of Telangana government schemes and the user's local geography (district, mandal, village when provided). Always prefer official scheme details and avoid making up disbursement dates or eligibility – if unsure, direct the user to check at the Gram Panchayat or the official portal.

Key schemes you can explain:
${getSchemeSummary()}

When users report issues, summarize them clearly and suggest relevant schemes or next steps (e.g., grievance filing, contacting Sarpanch). Be concise but thorough. Respond in the same language the user uses (Telugu or English).`;

export function useGemini(apiKey: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateText = useCallback(
    async (userMessage: string, context?: { district?: string; mandal?: string; village?: string }) => {
      if (!apiKey?.trim()) {
        setError("API key not set. Add VITE_GEMINI_API_KEY in .env or in the app settings.");
        return null;
      }
      setError(null);
      setLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey });
        const locationContext =
          context?.village && context?.mandal && context?.district
            ? `\nUser's location: ${context.village}, ${context.mandal}, ${context.district} district, Telangana.`
            : "";
        const systemInstruction = VIKAS_SAHAYAK_SYSTEM + (locationContext || "");
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          systemInstruction,
          contents: userMessage,
          config: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        });
        const text = (response as { text?: string })?.text ?? null;
        return text;
      } catch (e) {
        const message = e instanceof Error ? e.message : "AI request failed.";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiKey]
  );

  return { generateText, loading, error };
}
