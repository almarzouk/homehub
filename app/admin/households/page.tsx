"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Search,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Calendar,
  Key,
  X,
  Hash,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

interface AdminHousehold {
  _id: string;
  name: string;
  ownerName: string;
  memberCount: number;
  inviteCode: string;
  createdAt: string;
}

export default function AdminHouseholdsPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [households, setHouseholds] = useState<AdminHousehold[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminHousehold | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/households");
      if (res.status === 403) { setError(t("admin.accessDenied")); return; }
      const data = await res.json();
      if (Array.isArray(data)) setHouseholds(data);
    } catch { setError(t("common.error")); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const doDelete = async (id: string) => {
    setActionLoading(id);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/admin/households?householdId=${id}`, { method: "DELETE" });
      if (res.ok) await load();
    } finally { setActionLoading(null); }
  };

  const filtered = households.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      h.inviteCode.toLowerCase().includes(search.toLowerCase())
  );

  const totalMembers = households.reduce((sum, h) => sum + h.memberCount, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-green-400" />
            {t("admin.households")}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {households.length} households · {totalMembers} members total
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {t("common.refresh")}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{households.length}</p>
            <p className="text-xs text-gray-400">{t("admin.totalHouseholds")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalMembers}</p>
            <p className="text-xs text-gray-400">{t("admin.memberCount")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center">
            <Hash className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {households.length > 0
                ? (totalMembers / households.length).toFixed(1)
                : "0"}
            </p>
            <p className="text-xs text-gray-400">Avg. members</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 flex-1 bg-gray-800 rounded-xl px-3 py-2.5">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.search")}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0">{filtered.length} results</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Building2 className="h-10 w-10 text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">{t("admin.noHouseholds")}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {filtered.map((hh) => (
              <div key={hh._id} className="flex items-center gap-4 p-4 hover:bg-gray-800/30 transition-colors">
                {/* Icon */}
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-green-900/40">
                  <Building2 className="h-5 w-5 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{hh.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Owner: <span className="text-gray-300">{hh.ownerName}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      {hh.memberCount} {t("admin.memberCount").toLowerCase()}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(hh.createdAt).toLocaleDateString(lang)}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs text-indigo-400 bg-indigo-900/40 px-2 py-0.5 rounded-lg">
                      <Key className="h-3 w-3" />
                      {hh.inviteCode}
                    </span>
                  </div>
                </div>

                {/* Member count badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 text-xs font-medium text-gray-300">
                    <Users className="h-3.5 w-3.5 text-blue-400" />
                    {hh.memberCount}
                  </div>

                  {/* View details */}
                  <Link
                    href={`/admin/households/${hh._id}`}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-green-900/40 hover:text-green-400 transition-colors"
                    title="View details"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>

                  {/* Delete */}
                  <button
                    onClick={() => setConfirmDelete(hh)}
                    disabled={!!actionLoading}
                    title={t("admin.deleteHousehold")}
                    className="p-2 rounded-lg bg-gray-800 text-gray-500 hover:bg-red-900/40 hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">{t("admin.deleteHousehold")}?</h3>
                <p className="text-sm text-gray-400">{t("admin.confirmDeleteHousehold")}</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-800 space-y-1">
              <p className="text-sm font-semibold text-white">{confirmDelete.name}</p>
              <p className="text-xs text-gray-400">
                {confirmDelete.memberCount} members · Owner: {confirmDelete.ownerName}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => doDelete(confirmDelete._id)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {actionLoading && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 shadow-xl text-sm text-white z-50">
          <RefreshCw className="h-4 w-4 animate-spin text-green-400" />
          {t("common.loading")}
        </div>
      )}
    </div>
  );
}
