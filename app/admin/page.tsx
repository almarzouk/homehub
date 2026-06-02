"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  isBlocked: boolean;
  householdId: string | null;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  blockedUsers: number;
  adminUsers: number;
  newUsersToday: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/stats"),
      ]);

      if (usersRes.status === 403 || statsRes.status === 403) {
        router.push("/");
        return;
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (Array.isArray(usersData)) setUsers(usersData);
      if (statsData.totalUsers !== undefined) setStats(statsData);
    } catch {
      setError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const doAction = async (userId: string, action: string) => {
    setActionLoading(userId + action);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) await load();
    } finally {
      setActionLoading(null);
    }
  };

  const doDelete = async (userId: string) => {
    setActionLoading(userId + "delete");
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) await load();
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-500" />
            Admin Panel
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage users and website activity</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
            { label: "Admins", value: stats.adminUsers, icon: Crown, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950" },
            { label: "Blocked", value: stats.blockedUsers, icon: UserX, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950" },
            { label: "New Today", value: stats.newUsersToday, icon: UserCheck, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950" },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email…"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
          />
          <span className="text-xs text-gray-400">{filtered.length} users</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No users found.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((user) => (
              <div key={user._id} className="flex items-center gap-3 p-4">
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                  user.role === "admin" ? "bg-gradient-to-br from-yellow-400 to-orange-500" : "bg-gradient-to-br from-blue-500 to-indigo-600"
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                    {user.role === "admin" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                        <Crown className="h-3 w-3" /> Admin
                      </span>
                    )}
                    {user.isBlocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                        <ShieldOff className="h-3 w-3" /> Blocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600">
                    Joined {new Date(user.createdAt).toLocaleDateString()} · Household: {user.householdId ?? "none"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Block / Unblock */}
                  <button
                    onClick={() => doAction(user._id, user.isBlocked ? "unblock" : "block")}
                    disabled={!!actionLoading}
                    title={user.isBlocked ? "Unblock user" : "Block user"}
                    className={`p-2 rounded-lg transition-colors ${
                      user.isBlocked
                        ? "bg-green-50 dark:bg-green-950 text-green-600 hover:bg-green-100"
                        : "bg-red-50 dark:bg-red-950 text-red-500 hover:bg-red-100"
                    }`}
                  >
                    {user.isBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                  </button>

                  {/* Make Admin / Remove Admin */}
                  <button
                    onClick={() => doAction(user._id, user.role === "admin" ? "removeAdmin" : "makeAdmin")}
                    disabled={!!actionLoading}
                    title={user.role === "admin" ? "Remove admin role" : "Make admin"}
                    className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950 text-yellow-600 hover:bg-yellow-100 transition-colors"
                  >
                    <Crown className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setConfirmDelete(user)}
                    disabled={!!actionLoading}
                    title="Delete user"
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Delete User?</h3>
                <p className="text-sm text-gray-500">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to delete <strong>{confirmDelete.name}</strong> ({confirmDelete.email})?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => doDelete(confirmDelete._id)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
