import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles } from "lucide-react";
import { useApi } from "@web/hooks/useApi";
import type { User as UserType } from "@shared/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  "How to apply for Maha Lakshmi ₹2500?",
  "What documents are needed for Rythu Bharosa?",
  "How do I track an issue with Mission Bhagiratha water?",
  "Who is my village Sarpanch and Ward Member?",
];

export default function VikasSahayak() {
  const { data: userResp } = useApi<{ user: UserType }>("/api/users/me");
  const user = userResp?.user;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Namaste${user?.name ? ` ${user.name}` : ""}! I am **Vikas Sahayak (వికాస్ సహాయక్)**, your AI assistant for Telangana Digital Village Governance.\n\nYou can ask me about **Telangana Government Welfare Schemes**, how to file grievances, MeeSeva procedures, or details about your Panchayat. How may I assist you today?`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateAnswer = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes("maha lakshmi") || q.includes("2500") || q.includes("cylinder")) {
      return `**Maha Lakshmi Scheme (మహా లక్ష్మి పథకం)**\n\n• **Benefits**: ₹2,500 monthly assistance for women, ₹500 subsidized LPG cylinder, and free TSRTC bus travel across Telangana.\n• **Eligibility**: Women resident of Telangana holding a White Ration Card / Food Security Card.\n• **Where to Apply**: Nearest MeeSeva centre or your Gram Panchayat Office.\n• **Documents Needed**: Aadhaar card, Ration Card, and bank passbook linked to Aadhaar.`;
    }

    if (q.includes("rythu bharosa") || q.includes("rythu bandhu") || q.includes("farmer")) {
      return `**Rythu Bharosa / Farmer Support (రైతు భరోసా)**\n\n• **Financial Support**: Seasonal agricultural investment support per acre to eligible landholder farmers.\n• **How to Enroll**: Ensure your Pattadar Passbook and Dharani portal records are verified. Submit your Aadhaar, bank passbook, and land passbook at the Mandal Agriculture Office (MAO).\n• **Crop Insurance**: Also enroll for Rythu Bima life insurance through your local Agriculture Extension Officer.`;
    }

    if (q.includes("water") || q.includes("bhagiratha") || q.includes("pipe") || q.includes("tap")) {
      return `**Mission Bhagiratha & Drinking Water Redressal**\n\n• You can report tap leaks, pipeline damage, or drinking water shortages directly in **GramSeva Terminal** using the **"Report Issue"** tab.\n• Choose category: **Water**, priority: **HIGH**.\n• It is automatically routed to your Ward Member and Gram Panchayat Secretary with a guaranteed resolution SLA.`;
    }

    if (q.includes("sarpanch") || q.includes("ward") || q.includes("panchayat")) {
      return `**Panchayat Directory & Representatives**\n\n• For your village (${user?.village || "your village"}, ${user?.mandal || "mandal"}), your Gram Panchayat Sarpanch and Ward Members are listed in the **Panchayat Directory** tab.\n• Sarpanch is the executive head overseeing Palle Pragathi, sanitation, and streetlights.\n• Ward Members represent individual ward streets and handle local grievance redressal.`;
    }

    if (q.includes("pension") || q.includes("aasara")) {
      return `**Aasara Pensions (ఆసరా పెన్షన్లు)**\n\n• Provides monthly social security pensions for senior citizens (65+ years), widows, weavers, toddy tappers, and persons with disabilities.\n• **Application**: Submit application at your Gram Panchayat or MeeSeva with age proof, disability certificate (SADAREM certificate for PwD), and active bank account.\n• Monitored under Panchayat Raj and Rural Development Department.`;
    }

    return `Thank you for your question. For matters regarding **${query}**, you can:\n\n1. Visit the **Welfare Schemes** tab to view complete eligibility guidelines and MeeSeva application steps.\n2. Use **Report Issue** if this relates to village civic problems (sanitation, drinking water, roads, electricity).\n3. In case of urgent police, fire, or medical requirements, click **🚨 Emergency & Help** for direct 24x7 dialing.`;
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      const reply = generateAnswer(text);
      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in max-w-4xl mx-auto pb-12">
      {/* Header Card */}
      <div
        className="rounded-3xl p-6 text-white shadow-lg border-2 border-[#CCB252] flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #67001A 0%, #8A1538 100%)" }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#CCB252] flex items-center justify-center text-[#67001A] shadow-md shrink-0 font-black">
            <Bot size={30} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">Vikas Sahayak</h1>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold uppercase tracking-wider text-[#CCB252]">
                AI Assistant
              </span>
            </div>
            <p className="text-xs text-white/90 mt-0.5">
              Guidance for Telangana Welfare Schemes, Civic Grievances & Panchayat Administration
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp}
            type="button"
            onClick={() => handleSend(qp)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#67001A] hover:text-[#67001A] transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Sparkles size={12} className="text-[#CCB252]" />
            {qp}
          </button>
        ))}
      </div>

      {/* Chat Messages Window */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 min-h-[420px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-[#67001A] text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#67001A] text-white shadow-sm"
                    : "bg-slate-50 border border-slate-200 text-slate-800"
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>
                <span
                  className={`text-[9px] block mt-2 ${
                    m.role === "user" ? "text-white/70 text-right" : "text-slate-400"
                  }`}
                >
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-[#CCB252] text-[#67001A] flex items-center justify-center shrink-0 mt-1 shadow-sm font-bold text-xs">
                  {user?.name?.[0] ?? "U"}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs italic">
              <Bot size={16} className="text-[#67001A] animate-bounce" />
              <span>Vikas Sahayak is thinking...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-100"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question about schemes, welfare, or grievances..."
            className="flex-1 p-3.5 rounded-2xl border-2 border-slate-200 focus:border-[#67001A] outline-none text-sm font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3.5 rounded-2xl bg-[#67001A] text-white hover:bg-[#8A1538] disabled:opacity-50 transition-colors shadow-sm"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
