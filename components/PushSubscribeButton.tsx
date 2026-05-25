"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushSubscribeButton() {
  const [status, setStatus] = useState<"idle" | "subscribed" | "denied" | "loading">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Register SW
    navigator.serviceWorker.register("/sw.js").catch(console.error);

    // Check current permission
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setStatus("subscribed");
        });
      });
    } else if (Notification.permission === "denied") {
      setStatus("denied");
    }
  }, []);

  const subscribe = async () => {
    if (!("serviceWorker" in navigator)) {
      alert("Browser unterstützt keine Push-Benachrichtigungen.");
      return;
    }
    setStatus("loading");

    try {
      // Get VAPID public key
      const vapidRes = await fetch("/api/push/register");
      const { vapidPublicKey } = await vapidRes.json();

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "web", subscription: sub.toJSON() }),
      });

      setStatus("subscribed");
    } catch (e) {
      console.error("Push subscribe error:", e);
      setStatus("idle");
    }
  };

  const unsubscribe = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    setStatus("idle");
  };

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/30 text-xs text-red-500">
        <BellOff className="h-3.5 w-3.5" />
        Benachrichtigungen blockiert
      </div>
    );
  }

  if (status === "subscribed") {
    return (
      <button onClick={unsubscribe}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-100 transition-colors border border-green-200 dark:border-green-800">
        <BellRing className="h-3.5 w-3.5 animate-[wiggle_1s_ease-in-out]" />
        Benachrichtigungen aktiv
      </button>
    );
  }

  return (
    <button onClick={subscribe} disabled={status === "loading"}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-800 disabled:opacity-60">
      <Bell className="h-3.5 w-3.5" />
      {status === "loading" ? "Aktiviere…" : "Benachrichtigungen aktivieren"}
    </button>
  );
}
