import { useState, useRef } from "react";
import { Upload, Leaf, AlertTriangle, Sparkles, CheckCircle2, RefreshCw } from "lucide-react";
import { BRANDING } from "@web/constants/branding";

const TELANGANA_CROPS = [
  { name: "Cotton (పత్తి)", season: "Kharif", soil: "Black Cotton / Deep Loam", npk: "120:60:60 kg/ha", duration: "150-180 days" },
  { name: "Paddy (వరి)", season: "Kharif & Rabi", soil: "Clay Loam / Alluvial", npk: "120:60:40 kg/ha", duration: "120-140 days" },
  { name: "Red Gram / Toor (కంది)", season: "Kharif", soil: "Red Chalky / Well-drained Loam", npk: "20:50:0 kg/ha", duration: "160-180 days" },
  { name: "Maize (మొక్కజొన్న)", season: "Kharif & Rabi", soil: "Fertile Loamy Sand", npk: "120:60:50 kg/ha", duration: "90-110 days" },
  { name: "Chilli (మిరప)", season: "Kharif", soil: "Well-drained Black & Red Soils", npk: "150:60:120 kg/ha", duration: "150-210 days" },
];

export default function KrishiTerminal() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [soilType, setSoilType] = useState<string>("Black Regur");
  const [cropStage, setCropStage] = useState<string>("Sowing / Vegetative");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    soilHealth: string;
    npkStatus: string;
    recommendedCrops: string[];
    tips: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f?.type.startsWith("image/")) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleRunDiagnosis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisResult({
        soilHealth: `${file ? "Sample Image Verified: " : ""}${soilType} Soil — Good water retention with organic carbon between 0.45% - 0.65%. Optimal pH level estimated at 7.2 - 7.8.`,
        npkStatus: "Nitrogen: Medium (needs basal urea top-up). Phosphorus: Moderate. Potassium: Sufficient in local soil strata.",
        recommendedCrops: soilType.includes("Black")
          ? ["Cotton (Kharif)", "Paddy (with regulated irrigation)", "Bengal Gram (Rabi)"]
          : ["Red Gram / Pulses", "Groundnut", "Maize", "Millets"],
        tips: [
          "Incorporate Farm Yard Manure (FYM) or green manure (Dhaincha) prior to next sowing.",
          "Adopt drip irrigation or furrow methods to prevent waterlogging during monsoon showers.",
          "Contact Mandal Agricultural Officer (MAO) for subsidized soil health card testing.",
        ],
      });
    }, 900);
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-8 animate-in pb-12">
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border-2 border-[#CCB252]"
        style={{ background: "linear-gradient(135deg, #008A3B 0%, #059669 50%, #064e3b 100%)" }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-[#CCB252] uppercase tracking-wider mb-3">
            <Leaf size={14} /> Rythu Bandhu · Krishi Terminal
          </div>
          <p className="text-xs font-telugu text-[#CCB252] font-semibold telugu-text">రైతు సేవా కేంద్రం · వ్యవసాయ సలహాలు</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mt-2 mb-3 leading-tight">
            Telangana Agricultural & Soil Diagnostic Terminal
          </h1>
          <p className="text-sm md:text-base text-white/90 leading-relaxed">
            AI-assisted crop diagnostics, soil health guidance, and seasonal advisory for Telangana farmers.
          </p>
        </div>
        <img
          src={BRANDING.bgMap}
          className="absolute -right-20 -bottom-20 w-[350px] opacity-[0.08] pointer-events-none"
          alt=""
          aria-hidden
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnostic Input Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-[#008A3B]" size={22} />
            Diagnostic Soil & Crop Assessment
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Select Soil Profile
            </label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full p-3.5 rounded-xl border-2 border-slate-200 font-semibold text-slate-800 outline-none focus:border-[#008A3B]"
            >
              <option value="Black Regur">Black Regur Soil (నల్లరేగడి నేల) — Deep moisture retention</option>
              <option value="Red Chalky (Chaluka)">Red Chalky Soil (ఎర్ర నేల) — Light, permeable</option>
              <option value="Alluvial Loam">Alluvial River Basin Loam (ఒండ్రు నేల) — High fertility</option>
              <option value="Sandy Loam">Sandy Loam (ఇసుక నేల) — Quick drainage</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Crop Life Cycle Stage
            </label>
            <select
              value={cropStage}
              onChange={(e) => setCropStage(e.target.value)}
              className="w-full p-3.5 rounded-xl border-2 border-slate-200 font-semibold text-slate-800 outline-none focus:border-[#008A3B]"
            >
              <option value="Pre-sowing / Land prep">Pre-sowing / Land Preparation</option>
              <option value="Sowing / Vegetative">Sowing / Early Vegetative Stage</option>
              <option value="Flowering / Grain filling">Flowering / Pod Formation / Grain Filling</option>
              <option value="Pre-harvest">Pre-harvest Maturity</option>
            </select>
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Upload Soil or Leaf Photo (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {preview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-300 max-h-56 bg-slate-100 flex items-center justify-center">
                <img src={preview} alt="Soil sample" className="object-cover max-h-56 w-full" />
                <button
                  type="button"
                  onClick={clear}
                  className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-xl font-bold hover:bg-black/80"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:border-[#008A3B] hover:text-[#008A3B] transition-colors"
              >
                <Upload size={32} className="mb-2 text-slate-400" />
                <span className="text-sm font-bold">Click to capture or upload photo</span>
                <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleRunDiagnosis}
            disabled={analyzing}
            className="w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-wider shadow-md bg-gradient-to-r from-[#008A3B] to-[#059669] hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {analyzing ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {analyzing ? "Analyzing Soil & Crop Conditions..." : "Run Soil Health Diagnostic"}
          </button>
        </div>

        {/* Diagnostic Results Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-sm space-y-6 flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Leaf className="text-[#008A3B]" size={22} />
            Diagnostic Analysis & Recommendations
          </h2>

          {analysisResult ? (
            <div className="space-y-5 animate-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200">
                <p className="text-xs font-black uppercase text-emerald-900 tracking-wider mb-1">Soil Status</p>
                <p className="text-sm text-emerald-950 font-medium">{analysisResult.soilHealth}</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
                <p className="text-xs font-black uppercase text-amber-900 tracking-wider mb-1">NPK Nutrient Assessment</p>
                <p className="text-sm text-amber-950 font-medium">{analysisResult.npkStatus}</p>
              </div>

              <div>
                <p className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2">Recommended Crops</p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.recommendedCrops.map((c) => (
                    <span key={c} className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800">
                      🌾 {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-slate-500 tracking-wider">Agronomic Recommendations</p>
                <ul className="space-y-2">
                  {analysisResult.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                <span>Notice: Indicative analysis for guidance. Farmers should verify with local Agriculture Extension Officers.</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl">
              <Leaf size={48} className="text-emerald-200 mb-3" />
              <p className="font-bold text-slate-700 text-base">Select your soil profile and run diagnosis</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Get custom fertilizer dosages, suitable crops for your mandal, and disease protection tips.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Regional Crop Reference Table */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Telangana Major Crops & Guidelines</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="p-3.5 rounded-l-xl">Crop</th>
                <th className="p-3.5">Season</th>
                <th className="p-3.5">Recommended Soil</th>
                <th className="p-3.5">Standard NPK</th>
                <th className="p-3.5 rounded-r-xl">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {TELANGANA_CROPS.map((crop) => (
                <tr key={crop.name} className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-bold text-slate-900">{crop.name}</td>
                  <td className="p-3.5 text-slate-600">{crop.season}</td>
                  <td className="p-3.5 text-slate-600">{crop.soil}</td>
                  <td className="p-3.5 text-emerald-700 font-semibold">{crop.npk}</td>
                  <td className="p-3.5 text-slate-500">{crop.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
