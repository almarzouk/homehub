"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";

interface ChatNachricht {
  _id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

function formatTime(str: string) {
  const d = new Date(str);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500",
];

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatNachricht[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [currentName, setCurrentName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/chat?limit=50");
    if (!res.ok) return;
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }, []);

  // Get current user name
  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then((d) => {
      setCurrentName(d?.user?.name ?? "");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    pollingRef.current = setInterval(load, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    if (res.ok) { setText(""); load(); }
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Haushalts-Chat</h1>
        <p className="text-sm text-gray-500">Nachrichten für alle Haushaltsmitglieder</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500">Noch keine Nachrichten. Schreibe die erste!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.senderName === currentName;
          const showSender = i === 0 || messages[i - 1].senderName !== msg.senderName;
          return (
            <div key={msg._id} className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
              {!isOwn && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-semibold ${avatarColor(msg.senderName)} ${showSender ? "" : "opacity-0"}`}>
                  {getInitials(msg.senderName)}
                </div>
              )}
              <div className={`max-w-[75%] space-y-0.5 ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                {!isOwn && showSender && <span className="text-xs text-gray-500 ml-1">{msg.senderName}</span>}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOwn ? "bg-blue-600 text-white rounded-br-sm" : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white rounded-bl-sm"}`}>
                  {msg.text}
                </div>
                <span className="text-xs text-gray-400 px-1">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Nachricht schreiben... (Enter zum Senden)"
          rows={1}
          className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none resize-none text-gray-900 dark:text-white placeholder-gray-400"
          style={{ minHeight: "40px", maxHeight: "120px" }}
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
