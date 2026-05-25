"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Trash2, Settings, Flame, CookingPot, Microwave, Gauge,
  UtensilsCrossed, ArrowUp, ArrowDown, Save, ChevronDown, ChevronRight,
  X, type LucideIcon,
} from "lucide-react";

interface Kochgerät {
  _id: string;
  name: string;
  icon: string;
  programme: string[];
  leistungen: string[];
}

type DeviceEdit = {
  programme: string[];
  leistungen: string[];
  newProgramm: string;
  newLeistung: string;
  dirty: boolean;
};

const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  "cooking-pot": CookingPot,
  microwave: Microwave,
  pressure: Gauge,
  utensils: UtensilsCrossed,
};
const ICON_BG: Record<string, string> = {
  flame: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400",
  "cooking-pot": "bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400",
  microwave: "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
  pressure: "bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
  utensils: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

function GeraetIcon({ icon }: { icon: string }) {
  const Icon = ICON_MAP[icon] ?? UtensilsCrossed;
  const bg = ICON_BG[icon] ?? ICON_BG.utensils;
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function ListEditor({
  label, items, onAdd, onRemove, onMove, inputValue, onInputChange, placeholder, dotColor,
}: {
  label: string;
  items: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  placeholder: string;
  dotColor: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-1.5 mb-2">
        {items.length === 0 && (
          <p className="text-sm text-gray-400 italic py-1">Noch keine Einträge</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
            <span className="flex-1 text-gray-800 dark:text-gray-200">{item}</span>
            <button onClick={() => onMove(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30">
              <ArrowUp className="h-3 w-3 text-gray-500" />
            </button>
            <button onClick={() => onMove(i, 1)} disabled={i === items.length - 1} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30">
              <ArrowDown className="h-3 w-3 text-gray-500" />
            </button>
            <button onClick={() => onRemove(i)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 ml-1">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button onClick={onAdd} disabled={!inputValue.trim()} className="px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-lg">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function KuecheEinstellungenPage() {
  const [geraete, setGeraete] = useState<Kochgerät[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editState, setEditState] = useState<Record<string, DeviceEdit>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/kueche/kochgeraete");
    const data = await res.json();
    const list: Kochgerät[] = Array.isArray(data) ? data : [];
    setGeraete(list);
    const state: Record<string, DeviceEdit> = {};
    for (const g of list) {
      state[g._id] = { programme: [...(g.programme ?? [])], leistungen: [...(g.leistungen ?? [])], newProgramm: "", newLeistung: "", dirty: false };
    }
    setEditState(state);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = (id: string, update: Partial<DeviceEdit>) =>
    setEditState((prev) => ({ ...prev, [id]: { ...prev[id], ...update } }));

  const addGeraet = async () => {
    if (!newName.trim()) return;
    setAddSaving(true);
    setError("");
    const res = await fetch("/api/kueche/kochgeraete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Fehler"); setAddSaving(false); return; }
    setNewName(""); setShowAdd(false); setAddSaving(false);
    load();
  };

  const removeGeraet = async (id: string, name: string) => {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    await fetch(`/api/kueche/kochgeraete/${id}`, { method: "DELETE" });
    load();
  };

  const saveDevice = async (id: string) => {
    const s = editState[id]; if (!s) return;
    setSavingId(id);
    const res = await fetch(`/api/kueche/kochgeraete/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programme: s.programme, leistungen: s.leistungen }),
    });
    if (res.ok) {
      patch(id, { dirty: false });
      setGeraete((prev) => prev.map((g) => g._id === id ? { ...g, programme: s.programme, leistungen: s.leistungen } : g));
    }
    setSavingId(null);
  };

  const addProgramm = (id: string) => {
    const s = editState[id]; if (!s) return;
    const v = s.newProgramm.trim();
    if (!v || s.programme.includes(v)) return;
    patch(id, { programme: [...s.programme, v], newProgramm: "", dirty: true });
  };
  const removeProgramm = (id: string, i: number) =>
    patch(id, { programme: editState[id].programme.filter((_, idx) => idx !== i), dirty: true });
  const moveProgramm = (id: string, i: number, dir: -1 | 1) => {
    const arr = [...editState[id].programme]; const t = i + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[i], arr[t]] = [arr[t], arr[i]];
    patch(id, { programme: arr, dirty: true });
  };

  const addLeistung = (id: string) => {
    const s = editState[id]; if (!s) return;
    const v = s.newLeistung.trim();
    if (!v || s.leistungen.includes(v)) return;
    patch(id, { leistungen: [...s.leistungen, v], newLeistung: "", dirty: true });
  };
  const removeLeistung = (id: string, i: number) =>
    patch(id, { leistungen: editState[id].leistungen.filter((_, idx) => idx !== i), dirty: true });
  const moveLeistung = (id: string, i: number, dir: -1 | 1) => {
    const arr = [...editState[id].leistungen]; const t = i + dir;
    if (t < 0 || t >= arr.length) return;
    [arr[i], arr[t]] = [arr[t], arr[i]];
    patch(id, { leistungen: arr, dirty: true });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kochgeräte</h1>
          <p className="text-sm text-gray-500">Programme und Leistungsstufen je Gerät verwalten</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Neues Gerät
        </button>
      </div>

      {showAdd && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Neues Kochgerät</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGeraet()} placeholder="z. B. Thermomix" autoFocus className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <div className="flex gap-2">
            <button onClick={() => { setShowAdd(false); setError(""); }} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Abbrechen</button>
            <button onClick={addGeraet} disabled={addSaving || !newName.trim()} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium">{addSaving ? "Speichere…" : "Hinzufügen"}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : geraete.length === 0 ? (
        <div className="text-center py-20">
          <Settings className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Noch keine Kochgeräte. Lege das erste an!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {geraete.map((g) => {
            const isOpen = expanded === g._id;
            const s = editState[g._id];
            return (
              <div key={g._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <GeraetIcon icon={g.icon} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{g.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s?.programme.length ?? g.programme.length} Programme &middot; {s?.leistungen.length ?? g.leistungen.length} Leistungsstufen
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpanded(isOpen ? null : g._id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      {isOpen ? "Schließen" : "Bearbeiten"}
                    </button>
                    <button onClick={() => removeGeraet(g._id, g.name)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isOpen && s && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 space-y-5 bg-gray-50 dark:bg-gray-950">
                    <ListEditor label="Programme" items={s.programme} onAdd={() => addProgramm(g._id)} onRemove={(i) => removeProgramm(g._id, i)} onMove={(i, d) => moveProgramm(g._id, i, d)} inputValue={s.newProgramm} onInputChange={(v) => patch(g._id, { newProgramm: v })} placeholder="z. B. Auftauen, Garen, Backen" dotColor="bg-orange-400" />
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <ListEditor label="Leistungsstufen" items={s.leistungen} onAdd={() => addLeistung(g._id)} onRemove={(i) => removeLeistung(g._id, i)} onMove={(i, d) => moveLeistung(g._id, i, d)} inputValue={s.newLeistung} onInputChange={(v) => patch(g._id, { newLeistung: v })} placeholder="z. B. 300W, 600W, 900W" dotColor="bg-blue-400" />
                    </div>
                    {s.dirty && (
                      <button onClick={() => saveDevice(g._id)} disabled={savingId === g._id} className="flex items-center gap-2 w-full justify-center py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                        <Save className="h-4 w-4" />
                        {savingId === g._id ? "Speichert…" : "Änderungen speichern"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
