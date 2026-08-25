import { useRef, useState, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";
import { classifyIssue } from "@/shared/services/issueClassification";
import { useLanguage } from "@/react-app/context/LanguageContext";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onClassification?: (result: ReturnType<typeof classifyIssue>) => void;
}

export default function VoiceInput({ onTranscript, onClassification }: VoiceInputProps) {
  const { t } = useLanguage();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "te-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      onTranscript(transcript);
      const classification = classifyIssue(transcript);
      onClassification?.(classification);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onTranscript, onClassification]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  if (!supported) {
    return (
      <p className="text-xs text-slate-500 italic">
        Speech recognition not supported in this browser.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={listening ? stopListening : startListening}
      className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-colors ${
        listening
          ? "bg-red-50 border-red-300 text-red-700"
          : "bg-white border-tg-maroon/30 text-tg-maroon hover:bg-tg-maroon/5"
      }`}
    >
      {listening ? <MicOff size={18} /> : <Mic size={18} />}
      {listening ? t.issue.listening : t.issue.speakProblem}
    </button>
  );
}
