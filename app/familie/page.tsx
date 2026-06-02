"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSession } from "next-auth/react";
import {
  Users, UserPlus, Trash2, Shield, User, Crown,
  Eye, EyeOff, CheckCircle2, AlertCircle, X, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-pink-500 to-rose-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-sky-600",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length;
  return colors[h];
}

export default function FamiliePage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/familie");
    const d = await r.json();
    setMembers(Array.isArray(d) ? d : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditMember(null);
    setName(""); setEmail(""); setPassword(""); setRole("user");
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (m: Member) => {
    setEditMember(m);
    setName(m.name); setEmail(m.email); setPassword(""); setRole(m.role);
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditMember(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    if (editMember) {
      // PATCH — update
      const body: Record<string, string> = { name, role };
      if (password) body.password = password;
      const r = await fetch(`/api/familie/${editMember._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      setSaving(false);
      if (!r.ok) { setFormError(d.error || "Fehler"); return; }
      showToast(`${name} wurde aktualisiert`);
    } else {
      // POST — create
      const r = await fetch("/api/familie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const d = await r.json();
      setSaving(false);
      if (!r.ok) { setFormError(d.error || "Fehler"); return; }
      showToast(`${name} wurde zur Familie hinzugefügt`);
    }

    closeForm();
    load();
  };

  const deleteMember = async (m: Member) => {
    if (!confirm(`${m.name} aus der Familie entfernen?`)) return;
    setDeleting(m._id);
    const r = await fetch(`/api/familie/${m._id}`, { method: "DELETE" });
    setDeleting(null);
    if (r.ok) { showToast(`${m.name} wurde entfernt`, "ok"); load(); }
    else { const d = await r.json(); showToast(d.error || "Fehler", "err"); }
  };

  const me = session?.user;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950 flex items-center justify-center">
            <Users className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("familie.title")}</h1>
            <p className="text-sm text-gray-500">{members.length} Mitglied{members.length !== 1 ? "er" : ""}</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Hinzufügen
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300 flex gap-2">
        <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>Alle Familienmitglieder teilen dieselbe App – Vorrat, Küche und Finanzen werden gemeinsam verwaltet.</span>
      </div>

      {/* Members list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {members.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Noch keine Mitglieder. Füge deine Familie hinzu!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {members.map((m) => {
                const isMe = me?.email === m.email;
                const isAdmin = m.role === "admin";
                return (
                  <li key={m._id} className="flex items-center gap-4 px-5 py-4">
                    {/* Avatar */}
                    <div className={cn(
                      "w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0",
                      avatarColor(m.name)
                    )}>
                      {initials(m.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{m.name}</p>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                            Du
                          </span>
                        )}
                        {isAdmin ? (
                          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-full font-medium">
                            <Crown className="h-2.5 w-2.5" />Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full font-medium">
                            <User className="h-2.5 w-2.5" />Mitglied
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">{m.email}</p>
                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">
                        Dabei seit {new Date(m.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                        title="Bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!isMe && (
                        <button
                          onClick={() => deleteMember(m)}
                          disabled={deleting === m._id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50"
                          title="Entfernen"
                        >
                          {deleting === m._id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950 flex items-center justify-center">
                  {editMember ? <Pencil className="h-4 w-4 text-pink-600" /> : <UserPlus className="h-4 w-4 text-pink-600" />}
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editMember ? "Mitglied bearbeiten" : "Mitglied hinzufügen"}
                </h2>
              </div>
              <button onClick={closeForm} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 text-red-600 px-3 py-2.5 rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vorname Nachname"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {!editMember && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-Mail</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@beispiel.de"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Passwort {editMember && <span className="text-gray-400 font-normal">(leer lassen = unverändert)</span>}
                </label>
                <div className="relative">
                  <input
                    required={!editMember}
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editMember ? "Neues Passwort" : "Passwort (min. 6 Zeichen)"}
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rolle</label>
                <div className="flex gap-2">
                  {([["user", "Mitglied", User], ["admin", "Admin", Crown]] as const).map(([val, label, Icon]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRole(val)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        role === val
                          ? val === "admin"
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                            : "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Admins können Mitglieder verwalten und alle Einstellungen ändern.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {saving ? "Speichern…" : editMember ? "Speichern" : "Hinzufügen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-[60] transition-all",
          toast.type === "ok" ? "bg-emerald-600" : "bg-red-600"
        )}>
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
