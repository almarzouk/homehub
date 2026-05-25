import { getAssetById } from "@/lib/portfolio-catalog";

const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";
const CACHE_MS = 15 * 60 * 1000;

const priceCache = new Map<string, { eurCents: number; at: number }>();
let eurUsdRate = 0.92;

async function fetchYahooPrice(
  ticker: string
): Promise<{ price: number; currency: string } | null> {
  try {
    const res = await fetch(
      `${YAHOO_CHART}/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
      {
        headers: { "User-Agent": "Mozilla/5.0 HomeHub/1.0" },
        next: { revalidate: 900 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    return {
      price: meta.regularMarketPrice as number,
      currency: (meta.currency as string) ?? "USD",
    };
  } catch {
    return null;
  }
}

async function refreshEurUsdRate() {
  const r = await fetchYahooPrice("EURUSD=X");
  if (r && r.currency === "USD") {
    eurUsdRate = r.price > 0 ? 1 / r.price : 0.92;
  } else if (r && r.price > 0) {
    eurUsdRate = r.price;
  }
}

function toEurCents(price: number, currency: string): number {
  const c = currency.toUpperCase();
  let eur = price;
  if (c === "USD" || c === "USX") eur = price * eurUsdRate;
  else if (c === "GBP" || c === "GBP") eur = price * 1.17;
  else if (c === "CHF") eur = price * 1.05;
  return Math.round(eur * 100);
}

export async function fetchPriceEurCents(ticker: string): Promise<number | null> {
  const cached = priceCache.get(ticker);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.eurCents;

  const quote = await fetchYahooPrice(ticker);
  if (!quote) return null;

  if (quote.currency.toUpperCase() === "EUR") {
    const cents = Math.round(quote.price * 100);
    priceCache.set(ticker, { eurCents: cents, at: Date.now() });
    return cents;
  }

  await refreshEurUsdRate();
  const cents = toEurCents(quote.price, quote.currency);
  priceCache.set(ticker, { eurCents: cents, at: Date.now() });
  return cents;
}

export async function refreshAllInvestmentPrices() {
  const { connectDB } = await import("@/lib/db");
  const Investment = (await import("@/models/Investment")).default;

  await connectDB();
  await refreshEurUsdRate();

  const investments = await Investment.find({ ticker: { $exists: true, $ne: "" } });
  const updated: { id: string; ticker: string; priceEur: number; currentValue: number }[] = [];
  const errors: string[] = [];

  for (const inv of investments) {
    if (!inv.ticker) continue;
    const priceCents = await fetchPriceEurCents(inv.ticker);
    if (priceCents == null) {
      errors.push(inv.ticker);
      continue;
    }
    const shares = inv.shares ?? 0;
    const currentValue =
      shares > 0 ? Math.round(shares * priceCents) : inv.currentValue;

    inv.priceEur = priceCents;
    inv.lastPriceUpdate = new Date();
    inv.currentValue = currentValue;
    await inv.save();
    updated.push({ id: String(inv._id), ticker: inv.ticker, priceEur: priceCents, currentValue });
    await new Promise((r) => setTimeout(r, 200));
  }

  return { updated: updated.length, errors, items: updated };
}

export function daysUntilNextExecution(dayOfMonth: number): number {
  const now = new Date();
  const today = now.getDate();
  let target = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
  if (today > dayOfMonth) {
    target = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
  } else if (today === dayOfMonth) {
    return 0;
  }
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Re-export for convenience
export { getAssetById };
