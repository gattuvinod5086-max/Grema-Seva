import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Upload, Leaf, AlertTriangle } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import GlassCard from "@/react-app/components/GlassCard";
import { useAppSession } from "@/react-app/context/AppSessionContext";

const GEMINI_KRISHI_SYSTEM = `You are an agricultural diagnostic assistant for Telangana farmers. Analyze the uploaded image (soil or crop).

Provide:
1. Likely soil type (e.g., Red Chalky, Black Regur, Alluvial) if it's soil; or crop health and visible issues if it's a crop.
2. Possible NPK (Nitrogen, Phosphorus, Potassium) deficiencies if visible or inferable.
3. Seasonal crop suggestions suitable for Telangana (e.g., Paddy, Cotton, Maize, pulses) based on soil/condition.
Keep the response structured, concise, and in plain language. Add a one-line disclaimer that this is indicative only and farmers should confirm with local agriculture officers.`;

export default function KrishiTerminal() {
  const navigate = useNavigate();
  useAppSession(); // session available for future context
  const apiKey = (import.meta as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY ?? "";
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f?.type.startsWith("image/")) return;
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!file || !apiKey.trim()) {
      setError(apiKey ? "Please select an image." : "Add VITE_GEMINI_API_KEY in .env for Krishi AI.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const base64 = preview?.split(",")[1];
      if (!base64) throw new Error("Could not read image.");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: GEMINI_KRISHI_SYSTEM + "\n\nAnalyze this image (soil or crop) and provide the structured response." },
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64,
                },
              },
            ],
          },
        ],
      });
      const text = (response as { text?: string })?.text ?? "No analysis returned.";
      setResult(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen grama-pattern pb-24">
      <header className="sticky top-0 z-10 glass-card rounded-b-glass border-t-0 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="active-scale p-2 rounded-xl border border-slate-200 text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading text-xl text-primary">Krishi Terminal</h1>
          <p className="text-xs text-slate-500 font-body">Visual Agri-AI</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <GlassCard className="p-4 flex items-start gap-3 terminal-reveal">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 font-body">
            <strong>System disclaimer:</strong> AI-generated agricultural advice is indicative only.
            Always confirm with your local agriculture officer or Krishi Vigyan Kendra before taking
            decisions on crops or inputs.
          </p>
        </GlassCard>

        <GlassCard className="p-6 terminal-reveal">
          <h2 className="font-body font-bold text-slate-900 mb-2">Upload soil or crop photo</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="active-scale w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-slate-200 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 rounded-xl object-cover"
              />
            ) : (
              <>
                <Upload className="w-10 h-10 text-emerald-600" />
                <span className="text-slate-600 font-body font-semibold">Tap to select or capture</span>
              </>
            )}
          </button>
          {preview && (
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={analyze}
                disabled={loading}
                className="active-scale flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Leaf className="w-5 h-5" />
                {loading ? "Analyzing…" : "Analyze"}
              </button>
              <button
                type="button"
                onClick={clear}
                className="active-scale px-4 py-3 rounded-xl border border-slate-300 font-semibold text-slate-700"
              >
                Clear
              </button>
            </div>
          )}
        </GlassCard>

        {error && (
          <p className="text-sm text-red-600 font-semibold">{error}</p>
        )}

        {result && (
          <GlassCard className="p-6 terminal-reveal">
            <h3 className="font-body font-bold text-slate-900 mb-3">Analysis</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap font-body">{result}</p>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
