"use client";

import { useEffect, useState, useCallback } from "react";
import { Send, Bell, Clock, Megaphone, Home, Package, ChefHat, AlertCircle, Users, Trash2, CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";

const PushSubscribeButton = dynamic(() => import("@/components/PushSubscribeButton"), { ssr: false });

interface Notification {
  _id: string;
  senderName: string;
  title: string;
  body: string;
  url?: string;
  createdAt: string;
}

const QUICK_MESSAGES = [
  { icon: ChefHat, label: "Essen fertig!", title: "Essen ist fertig!", body: "Das Essen steht auf dem Tisch, kommt alle!" },
  { icon: Package, label: "Einkauf nötig", title: "Einkaufen notwendig", body: "Wir brauchen dringend Einkäufe. Bitte auf die Einkaufsliste schauen!" },
  { icon: Home, label: "Zu Hause", title: "Ich bin zu Hause!", body: "Ich bin gerade angekommen." },
  { icon: AlertCircle, label: "Wichtig!", title: "Wichtige Mitteilung", body: "Bitte kommt kurz zusammen, es gibt etwas Wichtiges zu besprechen." },
  { icon: Bell, label: "Termin", title: "Vergiss deinen Termin nicht!", body: "Denkt an den heutigen Termin!" },
];

export default function FamilyNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [deviceCount, setDeviceCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/push/send");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/push/register").then(r => r.json()).then(d => setDeviceCount(d.count ?? 0)).catch(() => {});
  }, [load]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: "/" }),
      });
      const data = await res.json();
      if (data.ok) {
        setLastResult({ sent: data.sent, failed: data.failed, total: data.total });
        setTitle("");
        setBody("");
        load();
      }
    } finally {
      setSending(false);
    }
  };

  const sendQuick = async (msg: (typeof QUICK_MESSAGES)[0]) => {
    setSending(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: msg.title, body: msg.body, url: "/" }),
      });
      const data = await res.json();
      if (data.ok) {
        setLastResult({ sent: data.sent, failed: data.failed, total: data.total });
        load();
      }
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (id: string) => {
    setDeleting(id);
    try {
      await fetch("/api/push/send", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const deleteAll = async () => {
    if (!confirm("Alle Benachrichtigungen löschen?")) return;
    for (const n of notifications) {
      await fetch("/api/push/send", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n._id }),
      });
    }
    setNotifications([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Familie-Benachrichtigungen</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Sende Echtzeit-Nachrichten an alle Geräte
            {deviceCount !== null && (
              <span className={`ml-2 inline-flex items-center gap-1 text-xs font-medium ${deviceCount > 0 ? "text-green-600" : "text-orange-500"}`}>
                · {deviceCount} {deviceCount === 1 ? "Gerät" : "Geräte"} registriert
              </span>
            )}
          </p>
        </div>
        <PushSubscribeButton />
      </div>

      {/* Warning when no devices registered */}
      {deviceCount === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
          <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-orange-800 dark:text-orange-300">Keine Geräte registriert</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
              Nachrichten werden gespeichert, aber nicht zugestellt. Klicke auf &ldquo;Benachrichtigungen aktivieren&rdquo; um dieses Gerät zu registrieren.
            </p>
          </div>
        </div>
      )}

      {/* Success feedback */}
      {lastResult && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-green-800 dark:text-green-300">Nachricht gesendet!</p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {lastResult.total === 0
                ? "Gespeichert — noch keine Geräte registriert."
                : `${lastResult.sent} von ${lastResult.total} Geräten erreicht${lastResult.failed > 0 ? ` · ${lastResult.failed} fehlgeschlagen` : ""}`}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose */}
        <div className="space-y-4">
          {/* Quick messages */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-orange-500" />
              Schnellnachrichten
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_MESSAGES.map((msg) => {
                const Icon = msg.icon;
                return (
                  <button key={msg.label} onClick={() => sendQuick(msg)} disabled={sending}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 border border-transparent hover:border-orange-200 dark:hover:border-orange-800 text-left transition-all group disabled:opacity-50">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                      <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{msg.label}</p>
                      <p className="text-xs text-gray-400 truncate">{msg.body}</p>
                    </div>
                    <Send className="h-3.5 w-3.5 text-gray-300 group-hover:text-orange-400 ml-auto flex-shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom message */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              Eigene Nachricht
            </h2>
            <form onSubmit={send} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Betreff *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Abendessen fertig!"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nachricht *</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3}
                  placeholder="Deine Nachricht an die Familie…"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-white placeholder:text-gray-400" />
              </div>

              {/* Live Preview */}
              {(title || body) && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0" />
                    <span className="text-xs text-gray-500">Vorschau · HomeHub</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-900">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{title || "Betreff…"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{body || "Nachricht…"}</p>
                  </div>
                </div>
              )}

              <button type="submit" disabled={sending || !title.trim() || !body.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {sending
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send className="h-4 w-4" />}
                {sending ? "Wird gesendet…" : "An alle senden"}
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            Verlauf
            <span className="text-xs text-gray-400 font-normal">{notifications.length} Nachrichten</span>
            {notifications.length > 0 && (
              <button onClick={deleteAll}
                className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
                <Trash2 className="h-3 w-3" />
                Alle löschen
              </button>
            )}
          </h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Noch keine Nachrichten gesendet</p>
              <p className="text-xs text-gray-400 mt-1">Aktiviere Benachrichtigungen oben und sende die erste Nachricht!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {notifications.map((n) => (
                <div key={n._id}
                  className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                    {n.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{n.title}</p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">von {n.senderName} · {new Date(n.createdAt).toLocaleDateString("de-DE")}</p>
                  </div>
                  <button
                    onClick={() => deleteNotification(n._id)}
                    disabled={deleting === n._id}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 text-gray-300 hover:text-red-500 transition-all self-start"
                    title="Löschen">
                    {deleting === n._id
                      ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
