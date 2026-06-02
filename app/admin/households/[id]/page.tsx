"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Users,
  Crown,
  ShieldCheck,
  ShieldOff,
  Key,
  Calendar,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Hash,
  Mail,
  User,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

interface MemberUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  isBlocked: boolean;
  isApproved: boolean;
  isOwner: boolean;
  isCoAdmin: boolean;
  createdAt: string;
}

interface HouseholdDetail {
  _id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  owner: { _id: string; name: string; email: string } | null;
  memberCount: number;
  coAdminCount: number;
  enabledModules: string[];
  members: MemberUser[];
}

const MODULE_LABELS: Record<string, string> = {
  inventory: "Inventory",
  recipes: "Recipes",
  shopping: "Shopping",
  finance: "Finance",
  meals: "Meals",
};

export default function HouseholdDetailPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [hh, setHh] = useState<HouseholdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/households/${id}`);
      if (res.status === 403) { setError(t("admin.accessDenied")); return; }
      if (res.status === 404) { setError("Household not found"); return; }
      const data = await res.json();
      setHh(data);
    } catch { setError(t("common.error")); }
    finally { setLoading(false); }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Link href="/admin/households" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Households
        </Link>
        <div className="flex items-center gap-2 p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-400 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />{error}
        </div>
      </div>
    );
  }

  if (!hh) return null;

  const activeBadge = (m: MemberUser) => {
    if (!m.isApproved)
      return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-900/60 text-yellow-400 border border-yellow-800/50"><Clock className="h-3 w-3" />{t("admin.pending")}</span>;
    if (m.isBlocked)
      return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-900/60 text-red-400 border border-red-800/50"><ShieldOff className="h-3 w-3" />{t("admin.blocked")}</span>;
    return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-900/60 text-green-400 border border-green-800/50"><CheckCircle className="h-3 w-3" />{t("admin.active")}</span>;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/households"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("admin.households")}
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-900/40">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {hh.name}
          </h1>
          <p className="text-sm text-gray-400 mt-1 ml-13">
            {t("admin.inviteCode")}: <span className="font-mono text-indigo-400">{hh.inviteCode}</span>
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {t("common.refresh")}
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{hh.memberCount}</p>
            <p className="text-xs text-gray-400">{t("admin.memberCount")}</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <Crown className="h-4 w-4 text-yellow-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{hh.coAdminCount}</p>
            <p className="text-xs text-gray-400">Co-Admins</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Package className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">
              {hh.enabledModules.length === 0 ? "All" : hh.enabledModules.length}
            </p>
            <p className="text-xs text-gray-400">Modules</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-700/60 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {new Date(hh.createdAt).toLocaleDateString(lang)}
            </p>
            <p className="text-xs text-gray-400">{t("admin.createdAt")}</p>
          </div>
        </div>
      </div>

      {/* Owner card */}
      {hh.owner && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-400" /> Owner
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {hh.owner.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{hh.owner.name}</p>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3 w-3" />{hh.owner.email}
              </p>
            </div>
            <Link
              href={`/admin/users`}
              className="ml-auto text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <User className="h-3.5 w-3.5" /> View in Users
            </Link>
          </div>
        </div>
      )}

      {/* Modules */}
      {hh.enabledModules.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-400" /> Active Modules
          </h2>
          <div className="flex flex-wrap gap-2">
            {hh.enabledModules.map((mod) => (
              <span key={mod} className="px-3 py-1.5 rounded-xl bg-purple-900/40 text-purple-300 border border-purple-800/50 text-xs font-medium">
                {MODULE_LABELS[mod] ?? mod}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Members table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            {t("admin.householdMembers")}
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{hh.memberCount}</span>
          </h2>
          <div className="flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-gray-500" />
            <span className="font-mono text-xs text-indigo-400">{hh.inviteCode}</span>
            <Hash className="h-3 w-3 text-gray-600" />
            <span className="text-xs text-gray-500">{t("admin.inviteCode")}</span>
          </div>
        </div>

        {hh.members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-10 w-10 text-gray-700 mb-3" />
            <p className="text-sm text-gray-500">No members yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800/60">
            {hh.members.map((member) => (
              <div key={member._id} className="flex items-center gap-4 p-4 hover:bg-gray-800/30 transition-colors">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                    member.isOwner
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                      : member.isCoAdmin
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                      : "bg-gradient-to-br from-blue-500 to-cyan-600"
                  }`}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">{member.name}</p>
                    {member.isOwner && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-900/60 text-yellow-400 border border-yellow-800/50">
                        <Crown className="h-3 w-3" /> Owner
                      </span>
                    )}
                    {member.isCoAdmin && !member.isOwner && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-900/60 text-indigo-400 border border-indigo-800/50">
                        <ShieldCheck className="h-3 w-3" /> Co-Admin
                      </span>
                    )}
                    {member.role === "admin" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-900/60 text-orange-400 border border-orange-800/50">
                        <ShieldCheck className="h-3 w-3" /> Site Admin
                      </span>
                    )}
                    {activeBadge(member)}
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" />{member.email}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {t("admin.joined")}: {new Date(member.createdAt).toLocaleDateString(lang)}
                  </p>
                </div>

                {/* Role badge */}
                <div className="flex-shrink-0">
                  {member.isOwner ? (
                    <Crown className="h-5 w-5 text-yellow-400" />
                  ) : member.isCoAdmin ? (
                    <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  ) : (
                    <User className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite code footer */}
      <div className="flex items-center gap-3 p-4 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl">
        <Key className="h-5 w-5 text-indigo-400 flex-shrink-0" />
        <div>
          <p className="text-xs text-gray-400">{t("admin.inviteCode")}</p>
          <p className="font-mono text-lg font-bold text-indigo-300 tracking-widest">{hh.inviteCode}</p>
        </div>
        <XCircle className="h-4 w-4 text-gray-600 ml-auto" />
      </div>
    </div>
  );
}
