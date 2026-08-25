import { Navigate } from "react-router";
import { DB_KEYS, MockDB } from "@/react-app/data/terminalData";
import { TerminalNewsEditor } from "@/react-app/pages/terminal/TerminalNewsEditor";
import { canUserPublishNews } from "@/react-app/services/localNews";
import { useApi } from "@/react-app/hooks/useApi";
import { canPublishNews } from "@/shared/constants/news";

export default function NewsCreatePage() {
  const isLocal = __GRAMA_LOCAL_DEV__;
  const localUser = isLocal ? MockDB.getUserByPhone(localStorage.getItem(DB_KEYS.SESSION) ?? "") : null;
  const { data: apiUser, isLoading } = useApi<{ role: string }>('/api/users/me', { enabled: !isLocal });

  if (isLocal) {
    if (!localUser) return <Navigate to="/app" replace />;
    if (!canUserPublishNews(localUser)) return <Navigate to="/news" replace />;
    return (
      <div className="min-h-screen py-8 px-4" style={{ background: "var(--tg-gradient-page)" }}>
        <TerminalNewsEditor user={localUser} onSave={() => window.location.href = "/news"} onCancel={() => window.history.back()} />
      </div>
    );
  }

  if (isLoading) return null;
  if (!apiUser || !canPublishNews(apiUser.role)) return <Navigate to="/news" replace />;

  return (
    <div className="min-h-screen py-8 px-4 bg-rose-50">
      <p className="max-w-4xl mx-auto text-center text-slate-600 mb-4">
        Use the GramSeva Terminal at <a href="/app" className="text-tg-maroon font-bold">/app</a> or API to create news in Cloudflare mode.
        Full web editor coming soon — POST /api/news is available.
      </p>
      <Navigate to="/news" replace />
    </div>
  );
}
