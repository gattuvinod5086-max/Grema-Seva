import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Send, Bot, User } from "lucide-react";
import GlassCard from "@/react-app/components/GlassCard";
import { useAppSession } from "@/react-app/context/AppSessionContext";
import { useGemini } from "@/react-app/hooks/useGemini";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function VikasSahayak() {
  const navigate = useNavigate();
  const { session } = useAppSession();
  const apiKey = (import.meta as { env?: { VITE_GEMINI_API_KEY?: string } }).env?.VITE_GEMINI_API_KEY ?? "";
  const { generateText, loading, error } = useGemini(apiKey);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    const reply = await generateText(text, {
      district: session?.district,
      mandal: session?.mandal,
      village: session?.village,
    });
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: reply || (error || "Sorry, I couldn’t generate a response. Please check your API key and try again."),
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, assistantMsg]);
  };

  return (
    <div className="min-h-screen grama-pattern flex flex-col pb-24">
      <header className="sticky top-0 z-10 glass-card rounded-b-glass border-t-0 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/app")}
          className="active-scale p-2 rounded-xl border border-slate-200 text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-heading text-xl text-primary">Vikas Sahayak</h1>
          <p className="text-xs text-slate-500 font-body">AI Assistant · Schemes & support</p>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 flex flex-col">
        {messages.length === 0 && (
          <GlassCard className="p-6 terminal-reveal mb-4">
            <p className="text-slate-600 font-body text-sm mb-2">
              Ask about Rythu Bandhu, Mission Bhagiratha, Palle Pragathi, Aasara Pensions, or any
              grievance. I’ll summarize and explain schemes relevant to your location.
            </p>
            {session?.village && (
              <p className="text-xs text-primary font-semibold">
                Your location: {session.village}, {session.mandal}, {session.district}
              </p>
            )}
          </GlassCard>
        )}

        <div className="space-y-4 flex-1 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-amber-700" />
                </div>
              )}
              <GlassCard
                className={`max-w-[85%] p-4 ${
                  msg.role === "user"
                    ? "bg-primary/10 border-primary/20 text-slate-900"
                    : "bg-white/95"
                }`}
              >
                <p className="text-sm font-body whitespace-pre-wrap">{msg.content}</p>
              </GlassCard>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-amber-700" />
              </div>
              <GlassCard className="p-4">
                <span className="text-sm text-slate-500">Vikas Sahayak is typing…</span>
              </GlassCard>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about schemes or report an issue..."
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-body"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="active-scale p-3 rounded-2xl bg-primary text-white disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </main>
    </div>
  );
}
