import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "grama_seva_session";

export interface GramaSevaSession {
  mobile: string;
  district: string;
  mandal: string;
  village: string;
  name?: string;
  verifiedAt: number;
}

interface AppSessionContextValue {
  session: GramaSevaSession | null;
  setSession: (s: GramaSevaSession | null) => void;
  isOnboarded: boolean;
  clearSession: () => void;
}

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<GramaSevaSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GramaSevaSession;
        if (parsed?.district && parsed?.mandal && parsed?.village && parsed?.verifiedAt) {
          setSessionState(parsed);
        }
      }
    } catch {
      setSessionState(null);
    }
    setHydrated(true);
  }, []);

  const setSession = useCallback((s: GramaSevaSession | null) => {
    setSessionState(s);
    if (s) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: AppSessionContextValue = {
    session,
    setSession,
    isOnboarded: hydrated && !!session,
    clearSession,
  };

  return (
    <AppSessionContext.Provider value={value}>
      {children}
    </AppSessionContext.Provider>
  );
}

/* eslint-disable react-refresh/only-export-components -- hook is co-located with provider */
export function useAppSession() {
  const ctx = useContext(AppSessionContext);
  if (!ctx) throw new Error("useAppSession must be used within AppSessionProvider");
  return ctx;
}
