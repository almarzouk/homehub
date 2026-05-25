"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, AlertTriangle, Info, AlertOctagon } from "lucide-react";

interface Alert {
  _id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "danger";
  category: string;
  isRead: boolean;
  createdAt: string;
}

export default function BenachrichtigungenPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/finanzen/benachrichtigungen");
    const data = await res.json();
    setAlerts(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await fetch("/api/finanzen/benachrichtigungen", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alleAlsGelesen: true }),
    });
    load();
  };

  const icon = (type: string) => {
    if (type === "danger") return <AlertOctagon className="h-4 w-4 text-red-500" />;
    if (type === "warning") return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  const bg = (type: string, isRead: boolean) => {
    const base = isRead ? "opacity-60 " : "";
    if (type === "danger") return base + "bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-900";
    if (type === "warning") return base + "bg-yellow-50 dark:bg-yellow-950 border-yellow-100 dark:border-yellow-900";
    return base + "bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900";
  };

  const unread = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Benachrichtigungen</h1>
          <p className="text-sm text-gray-500">{unread > 0 ? `${unread} ungelesen` : "Alle gelesen"}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <CheckCheck className="h-4 w-4" />
            Alle als gelesen markieren
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Keine Benachrichtigungen.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div key={a._id} className={`rounded-xl border px-4 py-3 ${bg(a.type, a.isRead)}`}>
              <div className="flex items-start gap-3">
                {icon(a.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleString("de-DE")}</p>
                </div>
                {!a.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
