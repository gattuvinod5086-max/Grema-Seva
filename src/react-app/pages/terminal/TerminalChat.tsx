import { useState, useRef, useEffect } from "react";
import { Send, Trash2, FileText, Award, AlertTriangle, UserCheck, Sparkles } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { TerminalGlassCard } from "./TerminalUI";
import type { AppUser, VillageIssue } from "@/react-app/data/terminalData";

const apiKey = (import.meta as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY ?? "";

export function TerminalChat({ user, issues }: { user: AppUser; issues: VillageIssue[] }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    {
      role: "ai",
      content: `Namaste, ${user.name}! I am Vikas Sahayak. I can help you summarize your reports, explain village schemes, or provide administrative guidance. What can I do for you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const userIssues = issues.filter((i) => i.citizenName === user.name);

  const suggestions = [
    {
      label: "My Reports Summary",
      icon: <FileText size={14} />,
      prompt: "Summarize all the issues I have reported and their current status.",
    },
    {
      label: "Scheme Status",
      icon: <Award size={14} />,
      prompt:
        "Provide comprehensive details about the 'Mission Bhagiratha' and 'Rythu Bandhu' schemes, including their purpose and current status in our village.",
    },
    {
      label: "Emergency Help",
      icon: <AlertTriangle size={14} />,
      prompt: "What is the procedure for reporting an emergency electricity or water issue?",
    },
    {
      label: "Welfare Eligibility",
      icon: <UserCheck size={14} />,
      prompt: "How do I check if I am eligible for the Aasara Pension scheme?",
    },
  ];

  const userContext = `
User Identity: ${user.name} (${user.role})
Location: Village: ${user.village}, Mandal: ${user.mandal}, District: ${user.district}

User's Issues Log:
${
  userIssues.length > 0
    ? userIssues
        .map(
          (i) =>
            `- [ID: ${i.id}] Category: ${i.category}, Status: ${i.status}, Priority: ${i.priority}, Description: ${i.description}, Date: ${i.createdAt}`
        )
        .join("\n")
    : "The user has no issues recorded in the system yet."
}

Village Welfare Status & Scheme Information:
- Mission Bhagiratha: A flagship Telangana Govt scheme aimed at providing safe piped drinking water to every household. Status in ${user.village}: 100% household tap connectivity achieved. Regular quality monitoring is ongoing.
- Rythu Bandhu: An investment support scheme providing ₹5,000 per acre per season to farmers. Status in ${user.village}: Disbursements for the current Yasangi season started on Oct 1st.
- Aasara Pensions: Social security pensions for old age, widows, and disabled. Status: Monthly disbursements are being processed via DBT (Direct Benefit Transfer).
- Palle Pragathi: Comprehensive village development program. Status: Road widening and sanitation drives are scheduled for next month.
`;

  const systemInstruction = `You are Vikas Sahayak, an intelligent administrative assistant for the Grama Seva portal of Telangana. 
Use the following context and your general knowledge about Telangana Government schemes to help the user:
${userContext}

Guidelines:
1. Be empathetic, highly professional, and informative.
2. Use Markdown for structured summaries (e.g., bullet points, bold text).
3. When asked about 'Scheme Status', provide both general knowledge about what the schemes are (Mission Bhagiratha = Drinking Water, Rythu Bandhu = Farmer Investment) and their local village-level status from the context provided.
4. When summarizing reports, highlight unresolved issues first.
5. Emphasize that you are an AI assistant and they should verify with the local Panchayat office for final official confirmations.
6. Keep responses concise, focused, and friendly.`;

  const sendMessage = async (customPrompt?: string) => {
    const txt = customPrompt ?? input;
    if (!txt.trim()) return;
    if (!customPrompt) setInput("");
    setLoading(true);
    setMessages((p) => [...p, { role: "user", content: txt }]);

    try {
      if (!apiKey.trim()) {
        setMessages((p) => [
          ...p,
          {
            role: "ai",
            content: "API key not set. Add VITE_GEMINI_API_KEY in .env to enable Vikas Sahayak.",
          },
        ]);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: txt,
        config: { systemInstruction },
      });
      const text = (res as { text?: string })?.text ?? "No response.";
      setMessages((p) => [...p, { role: "ai", content: text }]);
    } catch {
      setMessages((p) => [
        ...p,
        { role: "ai", content: "Connection timeout. Please try again shortly." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "ai",
        content: `Namaste, ${user.name}! I am Vikas Sahayak. How can I help you?`,
      },
    ]);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  return (
    <TerminalGlassCard className="min-h-[400px] max-h-[85vh] h-[75vh] md:h-[80vh] flex flex-col max-w-5xl mx-auto overflow-hidden animate-in">
      <div className="p-6 bg-[#67001A] text-white flex items-center justify-between border-b border-[#CCB252]/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-lg border border-[#CCB252]/30">
            <Sparkles size={22} className="text-[#CCB252]" aria-hidden />
          </div>
          <div>
            <h3 className="text-xl font-heading leading-tight">Vikas Sahayak</h3>
            <p className="text-sm font-telugu telugu-text text-white/90">వికాస్ సహాయక్</p>
            <p className="text-xs text-white/70 mt-0.5">Your Village Development Assistant</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="p-3 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
          aria-label="Clear chat"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#FAF9F6] custom-scrollbar"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] p-4 rounded-xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-[#67001A] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#1F2937]"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E5E7EB] p-4 rounded-xl flex gap-1.5 items-center">
              <div className="w-2 h-2 bg-[#67001A] rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-[#67001A] rounded-full animate-bounce [animation-delay:0.15s]" />
              <div className="w-2 h-2 bg-[#67001A] rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-5 bg-white border-t border-[#E5E7EB] space-y-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(s.prompt)}
              className="flex-shrink-0 px-4 py-2 bg-slate-50 text-[#64748B] rounded-lg text-xs font-semibold border border-[#E5E7EB] hover:bg-[#67001A] hover:text-white hover:border-[#67001A] transition-colors flex items-center gap-2 min-h-[40px]"
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            className="flex-1 p-4 rounded-lg border border-[#E5E7EB] text-sm outline-none focus:border-[#67001A]/40 focus:ring-2 focus:ring-[#67001A]/10"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about schemes, reports, or village services…"
            aria-label="Message to Vikas Sahayak"
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={loading}
            className="p-4 bg-[#67001A] text-white rounded-lg disabled:opacity-50 min-w-[52px] flex items-center justify-center"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </TerminalGlassCard>
  );
}
