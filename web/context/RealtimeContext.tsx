import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { Bell, Newspaper, AlertCircle, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApi } from '@web/hooks/useApi';
import type { RealtimeEvent, RealtimeEventType, User } from '@shared/types';

export interface AppNotification {
  id: string;
  type: RealtimeEventType;
  action: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  data?: Record<string, any>;
}

interface RealtimeToast {
  id: string;
  title: string;
  message: string;
  type: RealtimeEventType;
  action: string;
  link?: string;
  timestamp: Date;
}

interface RealtimeContextValue {
  status: 'connecting' | 'connected' | 'disconnected';
  lastEvent: RealtimeEvent | null;
  notifications: AppNotification[];
  unreadCount: number;
  subscribe: (listener: (event: RealtimeEvent) => void) => () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  hasDesktopPermission: boolean;
  requestDesktopPermission: () => Promise<boolean>;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Autoplay policy may restrict until gesture; safe to ignore
  }
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data: meData } = useApi<{ user: User }>('/api/users/me');
  const user = meData?.user ?? null;

  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [toasts, setToasts] = useState<RealtimeToast[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hasDesktopPermission, setHasDesktopPermission] = useState<boolean>(false);
  const listenersRef = useRef<Set<(event: RealtimeEvent) => void>>(new Set());

  // Check desktop notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasDesktopPermission(Notification.permission === 'granted');
    }
  }, []);

  const requestDesktopPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const res = await Notification.requestPermission();
      const granted = res === 'granted';
      setHasDesktopPermission(granted);
      return granted;
    } catch {
      return false;
    }
  }, []);

  // Load saved notifications from localStorage per user
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const key = `gramseva_notifications_${user.id}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {
      setNotifications([]);
    }
  }, [user]);

  // Persist notifications to localStorage
  const saveNotifications = useCallback(
    (updater: (prev: AppNotification[]) => AppNotification[]) => {
      setNotifications((prev) => {
        const next = updater(prev);
        if (user) {
          try {
            localStorage.setItem(`gramseva_notifications_${user.id}`, JSON.stringify(next.slice(0, 30)));
          } catch {}
        }
        return next;
      });
    },
    [user]
  );

  const markAsRead = useCallback(
    (id: string) => {
      saveNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    },
    [saveNotifications]
  );

  const markAllAsRead = useCallback(() => {
    saveNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [saveNotifications]);

  const clearAllNotifications = useCallback(() => {
    saveNotifications(() => []);
  }, [saveNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const subscribe = useCallback((listener: (event: RealtimeEvent) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const handleIncomingEvent = useCallback(
    (event: RealtimeEvent) => {
      let title = 'Update';
      let message = '';
      let link: string | undefined = undefined;

      if (event.type === 'notice') {
        title = event.action === 'created' ? '🔔 Official Village Notice' : 'Notice Removed';
        message = event.data?.title ?? 'An official public notice has been announced in your village.';
        link = '/notices?type=notice';
      } else if (event.type === 'news') {
        title = event.action === 'created' ? '📰 Community News' : 'News Removed';
        message = event.data?.title ?? 'New community update has been posted.';
        link = '/notices?type=news';
      } else if (event.type === 'issue') {
        if (event.action === 'created') {
          title = '⚠️ New Village Issue Reported';
          message = `${event.data?.code ?? 'Issue'} (${event.data?.category ?? 'General'}) has been filed in your village.`;
          link = '/board';
        } else {
          title = '📋 Issue Updated';
          message = `${event.data?.code ?? 'Issue'} status is now ${event.data?.status ?? 'updated'}.`;
          link = '/board';
        }
      }

      // 1. Play audio chime
      playNotificationChime();

      // 2. Add to persistent notification drawer
      const newNotification: AppNotification = {
        id: Math.random().toString(36).slice(2),
        type: event.type,
        action: event.action,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        link,
        data: event.data,
      };

      saveNotifications((prev) => [newNotification, ...prev].slice(0, 30));

      // 3. Show native system notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const nativeNotice = new Notification(title, {
            body: message,
            icon: '/favicon.ico',
          });
          if (link) {
            nativeNotice.onclick = () => {
              window.focus();
              navigate(link!);
            };
          }
        } catch {}
      }

      // 4. Show live floating in-app toast
      const toast: RealtimeToast = {
        id: Math.random().toString(36).slice(2),
        title,
        message,
        type: event.type,
        action: event.action,
        link,
        timestamp: new Date(),
      };

      setToasts((prev) => [toast, ...prev].slice(0, 5));

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    },
    [saveNotifications, navigate]
  );

  useEffect(() => {
    if (!user) {
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');
    const es = new EventSource('/api/realtime');

    es.addEventListener('connected', () => {
      setStatus('connected');
    });

    es.addEventListener('change', (e) => {
      try {
        const parsed: RealtimeEvent = JSON.parse(e.data);
        setLastEvent(parsed);
        handleIncomingEvent(parsed);
        listenersRef.current.forEach((fn) => fn(parsed));
      } catch (err) {
        console.error('[realtime] parse error:', err);
      }
    });

    es.onerror = () => {
      setStatus('disconnected');
    };

    return () => {
      es.close();
      setStatus('disconnected');
    };
  }, [user, handleIncomingEvent]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <RealtimeContext.Provider
      value={{
        status,
        lastEvent,
        notifications,
        unreadCount,
        subscribe,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        hasDesktopPermission,
        requestDesktopPermission,
      }}
    >
      {children}

      {/* Floating Realtime Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => {
              if (toast.link) navigate(toast.link);
            }}
            className="pointer-events-auto cursor-pointer bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-3.5 flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in hover:shadow-2xl hover:border-slate-300"
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                toast.type === 'notice'
                  ? 'bg-amber-100 text-amber-800'
                  : toast.type === 'news'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {toast.type === 'notice' ? (
                <Bell className="w-4 h-4" />
              ) : toast.type === 'news' ? (
                <Newspaper className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between gap-1">
                <p className="font-bold text-slate-900 truncate">{toast.title}</p>
                {toast.link && <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />}
              </div>
              <p className="text-slate-600 line-clamp-2 mt-0.5">{toast.message}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">Just now · Click to view</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg shrink-0 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return ctx;
}

/**
 * Hook to listen for realtime events and automatically execute a callback (e.g. refetch).
 */
export function useRealtimeEvent(
  types: RealtimeEventType[] | 'all',
  callback: (event: RealtimeEvent) => void
) {
  const ctx = useContext(RealtimeContext);
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!ctx) return;

    return ctx.subscribe((event) => {
      if (types === 'all' || types.includes(event.type)) {
        cbRef.current(event);
      }
    });
  }, [ctx, types]);
}

/**
 * Status indicator pill component showing live connection status.
 */
export function LiveIndicator({ className = '' }: { className?: string }) {
  const ctx = useContext(RealtimeContext);
  const isConnected = ctx?.status === 'connected';

  if (!isConnected) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-bold tracking-wide uppercase shadow-2xs ${className}`}
      title="Realtime updates active"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>Live</span>
    </span>
  );
}
