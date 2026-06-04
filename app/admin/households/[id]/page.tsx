"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2, ArrowLeft, Users, Crown, ShieldCheck, ShieldOff, Key, Calendar,
  RefreshCw, AlertTriangle, CheckCircle, Clock, Package, Mail, User, MessageCircle,
  ChefHat, Wallet, ClipboardList, Gift, FileText, Pill, Activity, Sparkles,
  Truck, PawPrint, Car, Zap, Bell, TrendingUp, ArrowLeftRight,
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

interface ModuleData {
  chat: { count: number; recent: Array<{ senderName: string; text: string; createdAt: string }> };
  inventory: {
    productCount: number;
    products: Array<{ name: string; quantity?: number; unit?: string; category?: string }>;
    movementCount: number;
    movements: Array<{ type: string; quantity: number; note?: string; createdAt: string }>;
  };
  kitchen: { count: number; recent: Array<{ name: string; kategorie?: string; schwierigkeitsgrad?: string; createdAt: string }> };
  finances: {
    expenseCount: number;
    expenses: Array<{ title: string; amount: number; category?: string; date?: string }>;
    investmentCount: number;
    investments: Array<{ name: string; currentValue?: number; type?: string }>;
  };
  tasks: { count: number; recent: Array<{ titel: string; status: string; faelligAm?: string; assignedTo?: string }> };
  calendar: { count: number; recent: Array<{ titel: string; startDatum: string; endDatum?: string }> };
  wishes: { count: number; recent: Array<{ titel: string; preis?: number; prioritaet?: string; erfuellt?: boolean }> };
  documents: { count: number; recent: Array<{ titel: string; kategorie?: string; createdAt: string }> };
  medications: { count: number };
  fitness: { count: number };
  cleaning: { count: number };
  deliveries: { count: number };
  pets: { count: number };
  vehicles: { count: number };
  energy: { count: number };
  notifications: { count: number; recent: Array<{ title: string; body: string; senderName: string; createdAt: string }> };
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
  modules: ModuleData;
}

type TabId = "overview" | "chat" | "inventory" | "kitchen" | "finances" | "tasks" | "calendar" | "more";

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "kitchen", label: "Kitchen", icon: ChefHat },
  { id: "finances", label: "Finances", icon: Wallet },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "more", label: "More", icon: Sparkles },
];

function StatCard({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{children}</h3>;
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-gray-500 py-6 text-center">{label}</p>;
}

export default function HouseholdDetailPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const params = useParams();
  const id = params?.id as string;

  const [hh, setHh] = useState<HouseholdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("overview");

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

  const m = hh.modules;
  const fmt = (d: string) => new Date(d).toLocaleDateString(lang);
  const fmtDt = (d: string) => new Date(d).toLocaleString(lang);

  const statusBadge = (member: MemberUser) => {
    if (!member.isApproved)
      return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-900/60 text-yellow-400 border border-yellow-800/50"><Clock className="h-3 w-3" />{t("admin.pending")}</span>;
    if (member.isBlocked)
      return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-900/60 text-red-400 border border-red-800/50"><ShieldOff className="h-3 w-3" />{t("admin.blocked")}</span>;
    return <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-900/60 text-green-400 border border-green-800/50"><CheckCircle className="h-3 w-3" />{t("admin.active")}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/households" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" />Back to Households
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-900/40">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {hh.name}
          </h1>
          <p className="text-sm text-gray-400 mt-1 ms-13">
            {t("admin.inviteCode")}: <span className="font-mono text-indigo-400">{hh.inviteCode}</span>
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> {t("common.refresh")}
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} value={hh.memberCount} label={t("admin.memberCount")} color="bg-blue-500/10 border border-blue-500/20 text-blue-400" />
        <StatCard icon={Crown} value={hh.coAdminCount} label="Co-Admins" color="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400" />
        <StatCard icon={MessageCircle} value={m.chat.count} label="Chat Messages" color="bg-pink-500/10 border border-pink-500/20 text-pink-400" />
        <StatCard icon={Package} value={m.inventory.productCount} label="Products" color="bg-purple-500/10 border border-purple-500/20 text-purple-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              tab === tabId
                ? "bg-blue-600 text-white"
                : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div className="space-y-4">
          {/* Owner */}
          {hh.owner && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <SectionTitle>Owner</SectionTitle>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {hh.owner.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{hh.owner.name}</p>
                  <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5"><Mail className="h-3 w-3" />{hh.owner.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Module summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <SectionTitle>Module Data Summary</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { icon: MessageCircle, label: "Chat", value: m.chat.count, color: "text-pink-400" },
                { icon: Package, label: "Products", value: m.inventory.productCount, color: "text-purple-400" },
                { icon: ArrowLeftRight, label: "Movements", value: m.inventory.movementCount, color: "text-blue-400" },
                { icon: ChefHat, label: "Recipes", value: m.kitchen.count, color: "text-orange-400" },
                { icon: Wallet, label: "Expenses", value: m.finances.expenseCount, color: "text-emerald-400" },
                { icon: TrendingUp, label: "Investments", value: m.finances.investmentCount, color: "text-green-400" },
                { icon: ClipboardList, label: "Tasks", value: m.tasks.count, color: "text-cyan-400" },
                { icon: Calendar, label: "Events", value: m.calendar.count, color: "text-indigo-400" },
                { icon: Gift, label: "Wishes", value: m.wishes.count, color: "text-rose-400" },
                { icon: FileText, label: "Documents", value: m.documents.count, color: "text-yellow-400" },
                { icon: Pill, label: "Medications", value: m.medications.count, color: "text-red-400" },
                { icon: Activity, label: "Fitness", value: m.fitness.count, color: "text-lime-400" },
                { icon: Sparkles, label: "Cleaning", value: m.cleaning.count, color: "text-sky-400" },
                { icon: Truck, label: "Deliveries", value: m.deliveries.count, color: "text-amber-400" },
                { icon: PawPrint, label: "Pets", value: m.pets.count, color: "text-fuchsia-400" },
                { icon: Car, label: "Vehicles", value: m.vehicles.count, color: "text-teal-400" },
                { icon: Zap, label: "Energy", value: m.energy.count, color: "text-yellow-300" },
                { icon: Bell, label: "Notifications", value: m.notifications.count, color: "text-blue-300" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-2 bg-gray-800/60 rounded-xl p-3">
                  <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
                  <div>
                    <p className="text-sm font-bold text-white">{value}</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members list */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                {t("admin.householdMembers")}
                <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{hh.memberCount}</span>
              </h3>
              <div className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-gray-500" />
                <span className="font-mono text-xs text-indigo-400">{hh.inviteCode}</span>
              </div>
            </div>
            {hh.members.length === 0 ? (
              <EmptyState label="No members yet" />
            ) : (
              <div className="divide-y divide-gray-800/60">
                {hh.members.map((member) => (
                  <div key={member._id} className="flex items-center gap-4 p-4 hover:bg-gray-800/30 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                      member.isOwner ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                      member.isCoAdmin ? "bg-gradient-to-br from-indigo-500 to-purple-600" :
                      "bg-gradient-to-br from-blue-500 to-cyan-600"
                    }`}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white">{member.name}</p>
                        {member.isOwner && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-900/60 text-yellow-400 border border-yellow-800/50"><Crown className="h-3 w-3" />Owner</span>}
                        {member.isCoAdmin && !member.isOwner && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-900/60 text-indigo-400 border border-indigo-800/50"><ShieldCheck className="h-3 w-3" />Co-Admin</span>}
                        {member.role === "admin" && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-900/60 text-orange-400 border border-orange-800/50"><ShieldCheck className="h-3 w-3" />Site Admin</span>}
                        {statusBadge(member)}
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" />{member.email}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{t("admin.joined")}: {fmt(member.createdAt)}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {member.isOwner ? <Crown className="h-5 w-5 text-yellow-400" /> :
                       member.isCoAdmin ? <ShieldCheck className="h-5 w-5 text-indigo-400" /> :
                       <User className="h-5 w-5 text-gray-600" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Chat */}
      {tab === "chat" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-800 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-pink-400" />
            <span className="font-semibold text-white">Internal Chat</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{m.chat.count} total</span>
          </div>
          {m.chat.recent.length === 0 ? <EmptyState label="No messages yet" /> : (
            <div className="divide-y divide-gray-800/50 max-h-[500px] overflow-y-auto">
              {m.chat.recent.map((msg, i) => (
                <div key={i} className="p-4 hover:bg-gray-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-pink-400">{msg.senderName}</span>
                    <span className="text-[10px] text-gray-500">{fmtDt(msg.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-200">{msg.text}</p>
                </div>
              ))}
            </div>
          )}
          {m.chat.count > 20 && (
            <div className="p-3 border-t border-gray-800 text-center text-xs text-gray-500">
              Showing last 20 of {m.chat.count} messages
            </div>
          )}
        </div>
      )}

      {/* Tab: Inventory */}
      {tab === "inventory" && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-400" />
              <span className="font-semibold text-white">Products</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{m.inventory.productCount} total</span>
            </div>
            {m.inventory.products.length === 0 ? <EmptyState label="No products" /> : (
              <div className="divide-y divide-gray-800/50">
                {m.inventory.products.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/30">
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      {p.category && <p className="text-xs text-gray-500">{p.category}</p>}
                    </div>
                    {p.quantity != null && (
                      <span className="text-sm text-gray-300">{p.quantity} {p.unit ?? ""}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-blue-400" />
              <span className="font-semibold text-white">Recent Movements</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{m.inventory.movementCount} total</span>
            </div>
            {m.inventory.movements.length === 0 ? <EmptyState label="No movements" /> : (
              <div className="divide-y divide-gray-800/50">
                {m.inventory.movements.map((mv, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/30">
                    <div>
                      <p className="text-sm font-medium text-white">{mv.note ?? `Movement #${i + 1}`}</p>
                      <p className="text-xs text-gray-500">{fmtDt(mv.createdAt)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${mv.type === "IN" ? "bg-green-900/60 text-green-400" : mv.type === "OUT" ? "bg-red-900/60 text-red-400" : "bg-gray-800 text-gray-400"}`}>
                      {mv.type} {mv.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Kitchen */}
      {tab === "kitchen" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-800 flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-400" />
            <span className="font-semibold text-white">Recipes</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{m.kitchen.count} total</span>
          </div>
          {m.kitchen.recent.length === 0 ? <EmptyState label="No recipes" /> : (
            <div className="divide-y divide-gray-800/50">
              {m.kitchen.recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/30">
                  <div>
                    <p className="text-sm font-medium text-white">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.kategorie ?? ""} {r.schwierigkeitsgrad ? `· ${r.schwierigkeitsgrad}` : ""}</p>
                  </div>
                  <span className="text-xs text-gray-500">{fmt(r.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Finances */}
      {tab === "finances" && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-400" />
              <span className="font-semibold text-white">Expenses</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{m.finances.expenseCount} total</span>
            </div>
            {m.finances.expenses.length === 0 ? <EmptyState label="No expenses" /> : (
              <div className="divide-y divide-gray-800/50">
                {m.finances.expenses.map((e, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/30">
                    <div>
                      <p className="text-sm font-medium text-white">{e.title}</p>
                      {e.category && <p className="text-xs text-gray-500">{e.category}</p>}
                    </div>
                    <span className="text-sm font-semibold text-red-400">{e.amount?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <span className="font-semibold text-white">Investments</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{m.finances.investmentCount} total</span>
            </div>
            {m.finances.investments.length === 0 ? <EmptyState label="No investments" /> : (
              <div className="divide-y divide-gray-800/50">
                {m.finances.investments.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/30">
                    <div>
                      <p className="text-sm font-medium text-white">{inv.name}</p>
                      {inv.type && <p className="text-xs text-gray-500">{inv.type}</p>}
                    </div>
                    {inv.currentValue != null && (
                      <span className="text-sm font-semibold text-green-400">{inv.currentValue?.toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Tasks */}
      {tab === "tasks" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-800 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cyan-400" />
            <span className="font-semibold text-white">Tasks</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{m.tasks.count} total</span>
          </div>
          {m.tasks.recent.length === 0 ? <EmptyState label="No tasks" /> : (
            <div className="divide-y divide-gray-800/50">
              {m.tasks.recent.map((task, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/30">
                  <div>
                    <p className="text-sm font-medium text-white">{task.titel}</p>
                    {task.faelligAm && <p className="text-xs text-gray-500">Due: {fmt(task.faelligAm)}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    task.status === "erledigt" ? "bg-green-900/60 text-green-400" :
                    task.status === "in_arbeit" ? "bg-yellow-900/60 text-yellow-400" :
                    "bg-gray-800 text-gray-400"
                  }`}>{task.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Calendar */}
      {tab === "calendar" && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-400" />
            <span className="font-semibold text-white">Events</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{m.calendar.count} total</span>
          </div>
          {m.calendar.recent.length === 0 ? <EmptyState label="No events" /> : (
            <div className="divide-y divide-gray-800/50">
              {m.calendar.recent.map((ev, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/30">
                  <p className="text-sm font-medium text-white">{ev.titel}</p>
                  <span className="text-xs text-gray-400">{fmt(ev.startDatum)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: More */}
      {tab === "more" && (
        <div className="space-y-4">
          {/* Notifications */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-300" />
              <span className="font-semibold text-white">Notifications</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{m.notifications.count} total</span>
            </div>
            {m.notifications.recent.length === 0 ? <EmptyState label="No notifications" /> : (
              <div className="divide-y divide-gray-800/50">
                {m.notifications.recent.map((n, i) => (
                  <div key={i} className="p-4 hover:bg-gray-800/30">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold text-blue-300">{n.senderName}</span>
                      <span className="text-[10px] text-gray-500">{fmtDt(n.createdAt)}</span>
                    </div>
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-gray-400">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wishes */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex items-center gap-2">
              <Gift className="h-5 w-5 text-rose-400" />
              <span className="font-semibold text-white">Wishes</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{m.wishes.count} total</span>
            </div>
            {m.wishes.recent.length === 0 ? <EmptyState label="No wishes" /> : (
              <div className="divide-y divide-gray-800/50">
                {m.wishes.recent.map((w, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/30">
                    <div>
                      <p className="text-sm font-medium text-white">{w.titel}</p>
                      {w.prioritaet && <p className="text-xs text-gray-500">{w.prioritaet}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {w.preis != null && <span className="text-xs text-gray-300">{w.preis.toFixed(2)}</span>}
                      {w.erfuellt && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold text-white">Documents</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">{m.documents.count} total</span>
            </div>
            {m.documents.recent.length === 0 ? <EmptyState label="No documents" /> : (
              <div className="divide-y divide-gray-800/50">
                {m.documents.recent.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/30">
                    <div>
                      <p className="text-sm font-medium text-white">{doc.titel}</p>
                      {doc.kategorie && <p className="text-xs text-gray-500">{doc.kategorie}</p>}
                    </div>
                    <span className="text-xs text-gray-500">{fmt(doc.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Counters grid */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <SectionTitle>Other Module Counts</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Pill, label: "Medications", value: m.medications.count, color: "text-red-400" },
                { icon: Activity, label: "Fitness", value: m.fitness.count, color: "text-lime-400" },
                { icon: Sparkles, label: "Cleaning", value: m.cleaning.count, color: "text-sky-400" },
                { icon: Truck, label: "Deliveries", value: m.deliveries.count, color: "text-amber-400" },
                { icon: PawPrint, label: "Pets", value: m.pets.count, color: "text-fuchsia-400" },
                { icon: Car, label: "Vehicles", value: m.vehicles.count, color: "text-teal-400" },
                { icon: Zap, label: "Energy", value: m.energy.count, color: "text-yellow-300" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-2 bg-gray-800/60 rounded-xl p-3">
                  <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
                  <div>
                    <p className="text-sm font-bold text-white">{value}</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
