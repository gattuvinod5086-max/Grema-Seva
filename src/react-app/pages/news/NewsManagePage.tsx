import { Navigate } from "react-router";
import { DB_KEYS, MockDB } from "@/react-app/data/terminalData";
import { TerminalNewsManage } from "@/react-app/pages/terminal/TerminalNewsManage";
import { canUserPublishNews } from "@/react-app/services/localNews";
import { useApi } from "@/react-app/hooks/useApi";
import { canPublishNews } from "@/shared/constants/news";

export default function NewsManagePage() {
  const isLocal = __GRAMA_LOCAL_DEV__;
  const localUser = isLocal ? MockDB.getUserByPhone(localStorage.getItem(DB_KEYS.SESSION) ?? "") : null;
  const { data: apiUser } = useApi<{ role: string }>('/api/users/me', { enabled: !isLocal });

  if (isLocal) {
    if (!localUser) return <Navigate to="/app" replace />;
    if (!canUserPublishNews(localUser)) return <Navigate to="/news" replace />;
    return (
      <div className="min-h-screen py-8 px-4" style={{ background: "var(--tg-gradient-page)" }}>
        <TerminalNewsManage user={localUser} onEdit={() => {}} onBack={() => window.history.back()} />
      </div>
    );
  }

  if (!apiUser || !canPublishNews(apiUser.role)) return <Navigate to="/news" replace />;

  return (
    <div className="min-h-screen py-8 px-4 bg-rose-50">
      <p className="max-w-4xl mx-auto text-center text-slate-600">
        Manage news via GET /api/news?manage=1 — full manage UI at /app for officials.
      </p>
      <Navigate to="/news" replace />
    </div>
  );
}
