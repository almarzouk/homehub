/** Hilfsfunktionen für formatierte deutsche Anzeige. */

export function formatRelativ(iso?: string | null): string | null {
  if (!iso) return null;
  const datum = new Date(iso);
  if (Number.isNaN(datum.getTime())) return null;
  const diff = (Date.now() - datum.getTime()) / 1000;
  if (diff < 60) return "gerade eben";
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
  const tage = Math.floor(diff / 86400);
  if (tage === 1) return "gestern";
  if (tage < 7) return `vor ${tage} Tagen`;
  return datum.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatMinuten(minuten?: number | null): string | null {
  if (minuten == null || !Number.isFinite(minuten)) return null;
  if (minuten < 60) return `${minuten} Min.`;
  const std = Math.floor(minuten / 60);
  const rest = minuten % 60;
  return rest === 0 ? `${std} Std.` : `${std} Std. ${rest} Min.`;
}
