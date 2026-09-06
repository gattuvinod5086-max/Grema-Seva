import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { translations, type Lang } from "@web/i18n/translations";

type Translations = (typeof translations)[Lang];

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "grama_seva_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "te" ? "te" : "en";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return { lang: "en" as Lang, setLang: () => {}, t: translations.en };
  }
  return ctx;
}

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "te" : "en")}
      className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-tg-gold/50 bg-white/90 text-tg-maroon hover:bg-tg-gold/10 transition-colors"
      title="Switch language"
    >
      {lang === "en" ? "తెలుగు" : "English"}
    </button>
  );
}
