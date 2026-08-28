"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import DocRichEditor from "@/components/docs/DocRichEditor";
import { FilePenLine, Plus, X, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocTabItem {
  _id: string;
  title: string;
  content: string;
  updatedAt: string;
}

type SaveState = "idle" | "saving" | "saved";

export default function DocsPage() {
  const { t } = useTranslation();
  const [tabs, setTabs] = useState<DocTabItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [editingTitle, setEditingTitle] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ title: string; content: string } | null>(null);
  const prevActiveId = useRef<string | null>(null);

  const activeTab = tabs.find((tab) => tab._id === activeId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/docs");
    const data = await res.json();
    const loaded: DocTabItem[] = data.tabs ?? [];
    setTabs(loaded);
    setActiveId((prev) => {
      if (prev && loaded.some((tab) => tab._id === prev)) return prev;
      return loaded[0]?._id ?? null;
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (prevActiveId.current === activeId) return;
    prevActiveId.current = activeId;

    const tab = tabs.find((item) => item._id === activeId);
    if (!tab) {
      setTitle("");
      setContent("");
      return;
    }
    setTitle(tab.title);
    setContent(tab.content);
    setEditingTitle(false);
    setSaveState("idle");
  }, [activeId, tabs]);

  const flushSave = useCallback(async (id: string, payload: { title: string; content: string }) => {
    setSaveState("saving");
    const res = await fetch(`/api/docs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setTabs((prev) => prev.map((tab) => (tab._id === id ? { ...tab, ...data.tab } : tab)));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } else {
      setSaveState("idle");
    }
  }, []);

  const scheduleSave = useCallback((id: string, nextTitle: string, nextContent: string) => {
    pendingSave.current = { title: nextTitle, content: nextContent };
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload = pendingSave.current;
      if (payload) void flushSave(id, payload);
    }, 700);
  }, [flushSave]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const createTab = async () => {
    const res = await fetch("/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t("docs.untitled") }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const tab: DocTabItem = data.tab;
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab._id);
  };

  const deleteTab = async (id: string) => {
    if (!confirm(t("docs.deleteTabConfirm"))) return;
    await fetch(`/api/docs/${id}`, { method: "DELETE" });
    setTabs((prev) => {
      const next = prev.filter((tab) => tab._id !== id);
      if (activeId === id) setActiveId(next[0]?._id ?? null);
      return next;
    });
  };

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!activeId) return;
    setTabs((prev) => prev.map((tab) => (tab._id === activeId ? { ...tab, title: value } : tab)));
    scheduleSave(activeId, value, content);
  };

  const onContentChange = (value: string) => {
    setContent(value);
    if (!activeId) return;
    scheduleSave(activeId, title, value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] md:h-[calc(100dvh-4rem)] -mx-4 md:-mx-6 lg:-mx-8 -mt-2">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 md:px-6 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <div
            key={tab._id}
            className={cn(
              "group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
              tab._id === activeId
                ? "bg-white dark:bg-gray-800 text-violet-700 dark:text-violet-300 shadow-sm border border-gray-200 dark:border-gray-700"
                : "text-gray-500 hover:bg-white/70 dark:hover:bg-gray-800/70"
            )}
          >
            <button type="button" onClick={() => setActiveId(tab._id)} className="max-w-[140px] truncate">
              {tab.title}
            </button>
            <button
              type="button"
              onClick={() => deleteTab(tab._id)}
              className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-opacity"
              aria-label={t("common.delete")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={createTab}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/50 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          {t("docs.newTab")}
        </button>
      </div>

      {/* Editor */}
      {activeTab ? (
        <div className="flex-1 flex flex-col min-h-0 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                className="flex-1 text-xl sm:text-2xl font-bold bg-transparent border-b-2 border-violet-400 focus:outline-none text-gray-900 dark:text-white pb-1"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-start truncate hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                {title}
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
              {saveState === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("docs.saving")}
                </>
              )}
              {saveState === "saved" && (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  {t("docs.saved")}
                </>
              )}
            </div>
          </div>
          <DocRichEditor
            content={content}
            onChange={onContentChange}
            placeholder={t("docs.placeholder")}
            className="flex-1 min-h-0"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center mb-4">
            <FilePenLine className="h-8 w-8 text-violet-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t("docs.title")}</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">{t("docs.empty")}</p>
          <button
            type="button"
            onClick={createTab}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("docs.newTab")}
          </button>
        </div>
      )}
    </div>
  );
}
