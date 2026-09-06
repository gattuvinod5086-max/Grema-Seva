import { useMemo } from "react";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useApi } from "@web/hooks/useApi";
import IssueList from "@web/components/IssueList";
import type { IssueListResponse } from "@shared/types";

export default function VillageIssues() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const district = searchParams.get("district") ?? "";
  const mandal = searchParams.get("mandal") ?? "";
  const village = searchParams.get("village") ?? "";

  // The API scopes results server-side to the signed-in official's
  // jurisdiction; location params here are display context only.
  const apiUrl = useMemo(() => "/api/issues?limit=50", []);

  const { data, isLoading, error, refetch } = useApi<IssueListResponse>(apiUrl);
  const issues = data?.issues ?? [];

  const title = village || mandal || district || "Issues";
  const subtitle = [district, mandal, village].filter(Boolean).join(" • ");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/telangana")}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all text-gray-700 font-medium border border-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow hover:shadow-md transition-all"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-pink-200">
            <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-500 text-lg mt-4">Loading issues…</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-red-700 text-lg font-bold">Couldn’t load issues</p>
                <p className="text-gray-600 text-sm mt-1 break-words">{error.message}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-blue-600 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        ) : !issues ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-pink-200">
            <p className="text-gray-700 text-lg font-semibold">No data available yet</p>
            <p className="text-gray-500 text-sm mt-2">Try refreshing.</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl shadow-xl p-8 text-center border-2 border-pink-200">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-700 text-xl font-semibold mb-2">No issues found</p>
            <p className="text-gray-500 text-sm">There are no issues for this selection.</p>
          </div>
        ) : (
          <IssueList issues={issues} />
        )}
      </div>
    </div>
  );
}

