"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Crown,
  UserX,
  UserCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Filter,
  Sparkles,
  RotateCcw,
  Pencil,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  isBlocked: boolean;
  isApproved: boolean;
  householdId: string | null;
  createdAt: string;
  aiMonthlyLimit: number;
  aiRequestsThisMonth: number;
}

type FilterTab = "all" | "pending" | "active" | "blocked" | "admins";

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");
  const [editingLimit, setEditingLimit] = useState<{ userId: string; value: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) { setError(t("admin.accessDenied")); return; }
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch { setError(t("common.error")); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (userId: string, action: string, value?: number) => {
    setActionLoading(userId + action);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, value }),
      });
      if (res.ok) await load();
    } finally { setActionLoading(null); }
  };

  const saveAILimit = async (userId: string) => {
    if (!editingLimit) return;
    const num = parseInt(editingLimit.value, 10);
    if (!isNaN(num) && num >= 0) {
      await doAction(userId, "setAILimit", num);
    }
    setEditingLimit(null);
  };

  const doDelete = async (userId: string) => {
    setActionLoading(userId + "delete");
    setConfirmDelete(null);
    try {
      await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      await load();
    } finally { setActionLoading(null); }
  };

  const pending = users.filter((u) => !u.isApproved);
  const active = users.filter((u) => u.isApproved && !u.isBlocked);
  const blocked = users.filter((u) => u.isBlocked);
  const admins = users.filter((u) => u.role === "admin");

  const filterMap: Record<FilterTab, AdminUser[]> = {
    all: users,
    pending,
    active,
    blocked,
    admins,
  };

  const filtered = filterMap[filter].filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: FilterTab; label: string; count: number; color?: string }[] = [
    { key: "all", label: t("admin.allUsers"), count: users.length },
    { key: "pending", label: t("admin.pending"), count: pending.length, color: pending.length > 0 ? "text-yellow-400" : undefined },
    { key: "active", label: t("admin.activeUsers"), count: active.length },
    { key: "blocked", label: t("admin.blocked"), count: blocked.length },
    { key: "admins", label: t("admin.adminUsers"), count: admins.length },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-400" />
            {t("admin.users")}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} {t("admin.totalUsers").toLowerCase()}</p>
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

      {/* Pending banner */}
      {pending.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-950/50 border border-yellow-800/60 rounded-2xl">
          <Clock className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-300">
              {pending.length} {t("admin.pendingApprovals")}
            </p>
            <p className="text-xs text-yellow-600 mt-0.5">{pending.map((u) => u.name).join(", ")}</p>
          </div>
          <button
            onClick={() => setFilter("pending")}
            className="px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold transition-colors"
          >
            {t("admin.approve")}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Filter tabs + search */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 space-y-3">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-800 rounded-xl overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  filter === tab.key
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Filter className="h-3 w-3" />
                {tab.label}
                <span className={`text-xs ${filter === tab.key ? "text-blue-200" : (tab.color ?? "text-gray-600")}`}>
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2.5">
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
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-sm">{t("admin.noUsers")}</p>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {filtered.map((user) => (
              <div key={user._id} className="flex items-center gap-3 p-4 hover:bg-gray-800/30 transition-colors">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                    user.role === "admin"
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                      : !user.isApproved
                      ? "bg-gradient-to-br from-gray-600 to-gray-700"
                      : "bg-gradient-to-br from-blue-500 to-indigo-600"
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    {user.role === "admin" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/60 text-yellow-400 border border-yellow-800/60">
                        <Crown className="h-3 w-3" /> Admin
                      </span>
                    )}
                    {!user.isApproved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/60 text-yellow-400 border border-yellow-800/60">
                        <Clock className="h-3 w-3" /> {t("admin.pending")}
                      </span>
                    )}
                    {user.isBlocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/60 text-red-400 border border-red-800/60">
                        <ShieldOff className="h-3 w-3" /> {t("admin.blocked")}
                      </span>
                    )}
                    {user.isApproved && !user.isBlocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/60 text-green-400 border border-green-800/60">
                        <CheckCircle className="h-3 w-3" /> {t("admin.active")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Calendar className="h-3 w-3" />
                      {new Date(user.createdAt).toLocaleDateString(lang)}
                    </span>
                    {user.householdId && (
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Building2 className="h-3 w-3" />
                        {user.householdId.slice(-6)}
                      </span>
                    )}
                    {/* AI usage */}
                    <span className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md ${
                      user.aiRequestsThisMonth >= user.aiMonthlyLimit
                        ? "bg-red-900/40 text-red-400"
                        : user.aiRequestsThisMonth >= user.aiMonthlyLimit * 0.8
                        ? "bg-orange-900/40 text-orange-400"
                        : "bg-purple-900/30 text-purple-400"
                    }`}>
                      <Sparkles className="h-3 w-3" />
                      {user.aiRequestsThisMonth}/
                      {editingLimit?.userId === user._id ? (
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={editingLimit.value}
                          onChange={(e) => setEditingLimit({ userId: user._id, value: e.target.value })}
                          onBlur={() => saveAILimit(user._id)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveAILimit(user._id); if (e.key === "Escape") setEditingLimit(null); }}
                          className="w-10 bg-transparent outline-none border-b border-purple-500 text-xs"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => setEditingLimit({ userId: user._id, value: String(user.aiMonthlyLimit) })}
                          className="hover:underline"
                          title="Click to change limit"
                        >
                          {user.aiMonthlyLimit}
                        </button>
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Approve / Reject (only for pending) */}
                  {!user.isApproved && (                    <>
                      <button
                        onClick={() => doAction(user._id, "approve")}
                        disabled={!!actionLoading}
                        title={t("admin.approveUser")}
                        className="p-2 rounded-lg bg-green-900/40 text-green-400 hover:bg-green-900/70 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => doAction(user._id, "reject")}
                        disabled={!!actionLoading}
                        title={t("admin.rejectUser")}
                        className="p-2 rounded-lg bg-red-900/40 text-red-400 hover:bg-red-900/70 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {/* Block / Unblock */}
                  <button
                    onClick={() => doAction(user._id, user.isBlocked ? "unblock" : "block")}
                    disabled={!!actionLoading}
                    title={user.isBlocked ? t("admin.unblockUser") : t("admin.blockUser")}
                    className={`p-2 rounded-lg transition-colors ${
                      user.isBlocked
                        ? "bg-green-900/40 text-green-400 hover:bg-green-900/70"
                        : "bg-orange-900/40 text-orange-400 hover:bg-orange-900/70"
                    }`}
                  >
                    {user.isBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                  </button>

                  {/* Make / Remove Admin */}
                  <button
                    onClick={() => doAction(user._id, user.role === "admin" ? "removeAdmin" : "makeAdmin")}
                    disabled={!!actionLoading}
                    title={user.role === "admin" ? "Remove Admin" : "Make Admin"}
                    className={`p-2 rounded-lg transition-colors ${
                      user.role === "admin"
                        ? "bg-yellow-900/60 text-yellow-400 hover:bg-yellow-900/80"
                        : "bg-gray-800 text-gray-400 hover:bg-yellow-900/40 hover:text-yellow-400"
                    }`}
                  >
                    <Crown className="h-4 w-4" />
                  </button>

                  {/* Reset AI usage */}
                  <button
                    onClick={() => doAction(user._id, "resetAI")}
                    disabled={!!actionLoading || user.aiRequestsThisMonth === 0}
                    title="Reset AI usage"
                    className="p-2 rounded-lg bg-purple-900/30 text-purple-400 hover:bg-purple-900/60 transition-colors disabled:opacity-30"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  {/* Edit AI limit */}
                  <button
                    onClick={() => setEditingLimit({ userId: user._id, value: String(user.aiMonthlyLimit) })}
                    title="Edit AI limit"
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-purple-900/30 hover:text-purple-400 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setConfirmDelete(user)}
                    disabled={!!actionLoading}
                    className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-red-900/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">{t("admin.deleteUser")}?</h3>
                <p className="text-sm text-gray-400">{t("admin.confirmDelete")}</p>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              <strong>{confirmDelete.name}</strong> ({confirmDelete.email})
            </p>
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
    </div>
  );
}
