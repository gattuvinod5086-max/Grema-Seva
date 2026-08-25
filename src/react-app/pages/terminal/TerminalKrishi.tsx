import { useState, useRef } from "react";
import { Sprout, Camera, Droplets, Loader2, Info, ShieldAlert } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { TerminalGlassCard, Badge } from "./TerminalUI";
import type { AppUser } from "@/react-app/data/terminalData";

const apiKey = (import.meta as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY ?? "";

export function TerminalKrishi({ user }: { user: AppUser }) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeSoil = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    try {
      if (!apiKey.trim()) {
        setResult("Add VITE_GEMINI_API_KEY in .env to enable Krishi AI.");
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = image.split(",")[1];
      const prompt = `As Vikas Sahayak (Krishi AI), analyze this soil sample for a farmer in ${user.village}, Telangana. 
1. Identify the soil type (e.g., Red Chalky Soil, Black Regur Soil).
2. Estimate visual indicators: texture (clay/sandy), moisture level, and possible NPK deficiencies.
3. Suggest suitable crops for this soil type in the current season.
4. Provide 3 immediate corrective actions.
Keep the tone professional, encouraging, and clear. Format with markdown headings.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
      } as Parameters<typeof ai.models.generateContent>[0]);
      const text = (response as { text?: string })?.text ?? "No analysis returned.";
      setResult(text);
    } catch {
      setResult("System error: Unable to process agricultural diagnostic. Please ensure image clarity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in">
      <div className="flex items-center gap-6 px-2">
        <div className="p-4 bg-tg-green text-white rounded-2xl shadow-xl ring-2 ring-tg-gold/40">
          <Sprout size={28} />
        </div>
        <div>
          <p className="text-[10px] font-black text-tg-gold uppercase tracking-widest mb-0.5">తెలంగాణ రైతు బంధు</p>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
            Krishi <span className="text-tg-green">Terminal</span>
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
            Visual Agriculture AI Module
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TerminalGlassCard className="p-8 md:p-10 space-y-8 border-2 border-tg-green/20 shadow-lg bg-gradient-to-br from-white to-green-50/30">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-full aspect-square md:aspect-video rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-slate-50 relative group ${
              image ? "border-tg-green/30" : "border-slate-200 hover:border-tg-green"
            }`}
          >
            {image ? (
              <>
                <img src={image} className="w-full h-full object-cover" alt="Soil sample" />
                <div className="absolute inset-0 bg-tg-green/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Badge variant="emerald">Change Sample</Badge>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 bg-white rounded-3xl shadow-sm mb-6 text-tg-green group-hover:scale-110 transition-transform">
                  <Camera size={40} />
                </div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Capture Soil Sample
                </p>
                <p className="text-[10px] font-medium text-slate-400 mt-2">JPEG or PNG • Max 10MB</p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={analyzeSoil}
              disabled={!image || loading}
              className="col-span-2 py-6 bg-tg-green text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 hover:bg-tg-green-light transition-all flex items-center justify-center gap-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Droplets size={20} /> Soil Analysis
                </>
              )}
            </button>
            <button className="py-4 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl font-black text-[9px] uppercase tracking-widest opacity-50 cursor-not-allowed">
              Pest Diagnosis
            </button>
            <button className="py-4 bg-slate-50 text-slate-400 border border-slate-100 rounded-2xl font-black text-[9px] uppercase tracking-widest opacity-50 cursor-not-allowed">
              Leaf Health
            </button>
          </div>
        </TerminalGlassCard>

        <TerminalGlassCard
          className={`p-8 md:p-10 bg-tg-sidebar/95 text-white transition-all duration-700 ${
            result ? "opacity-100 translate-y-0" : "opacity-30 translate-y-4"
          }`}
        >
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
            <div className="flex items-center gap-4">
              <span className="text-tg-green-light text-2xl">🤖</span>
              <h3 className="text-xl font-black uppercase tracking-tighter">Diagnostic Report</h3>
            </div>
            {loading && <Loader2 className="animate-spin text-tg-green-light" size={20} />}
          </div>

          <div className="custom-scrollbar overflow-y-auto max-h-[500px] pr-4 space-y-6">
            {result ? (
              <div className="prose prose-invert text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {result}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                <Info className="text-white/20" size={48} />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/40">
                  Awaiting visual input for analysis
                </p>
              </div>
            )}
          </div>

          {result && (
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
              <div className="p-3 bg-white/5 rounded-xl">
                <ShieldAlert className="text-tg-gold" size={18} />
              </div>
              <p className="text-[10px] font-bold text-white/50 leading-tight">
                Disclaimer: This is an AI visual estimate. For precise chemical composition, visit
                the nearest Govt Soil Testing Lab.
              </p>
            </div>
          )}
        </TerminalGlassCard>
      </div>
    </div>
  );
}
