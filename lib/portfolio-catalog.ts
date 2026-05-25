/** Your real portfolio — tickers for Yahoo Finance, amounts in cents */

export interface PortfolioAsset {
  id: string;
  ticker: string;
  type: "stocks" | "ETF";
  monthlyPlanCents: number;
  dayOfMonth: number;
}

export const PORTFOLIO_ASSETS: PortfolioAsset[] = [
  { id: "asml", ticker: "ASML.AS", type: "stocks", monthlyPlanCents: 9000, dayOfMonth: 1 },
  { id: "gold", ticker: "8JO0.DE", type: "ETF", monthlyPlanCents: 4500, dayOfMonth: 1 },
  { id: "nvda", ticker: "NVDA", type: "stocks", monthlyPlanCents: 6000, dayOfMonth: 1 },
  { id: "msft", ticker: "MSFT", type: "stocks", monthlyPlanCents: 7000, dayOfMonth: 1 },
  { id: "islamic_gdm", ticker: "ISWD.DE", type: "ETF", monthlyPlanCents: 30000, dayOfMonth: 1 },
  { id: "rio", ticker: "RIO", type: "stocks", monthlyPlanCents: 5000, dayOfMonth: 1 },
  { id: "linde", ticker: "LIN", type: "stocks", monthlyPlanCents: 4500, dayOfMonth: 1 },
  { id: "tsm", ticker: "TSM", type: "stocks", monthlyPlanCents: 4000, dayOfMonth: 1 },
  { id: "jnj", ticker: "JNJ", type: "stocks", monthlyPlanCents: 0, dayOfMonth: 1 },
  { id: "siemens_energy", ticker: "ENR.DE", type: "stocks", monthlyPlanCents: 0, dayOfMonth: 1 },
];

export const PORTFOLIO_HOLDINGS: {
  id: string;
  shares: number;
  amountCents: number;
  currentValueCents: number;
}[] = [
  { id: "tsm", shares: 5.194834, amountCents: 115475, currentValueCents: 174287 },
  { id: "asml", shares: 1.3365, amountCents: 110100, currentValueCents: 166902 },
  { id: "msft", shares: 3.299206, amountCents: 139703, currentValueCents: 120800 },
  { id: "nvda", shares: 6.353579, amountCents: 98907, currentValueCents: 120426 },
  { id: "rio", shares: 8.193406, amountCents: 50100, currentValueCents: 71381 },
  { id: "gold", shares: 8.478571, amountCents: 58900, currentValueCents: 64259 },
  { id: "jnj", shares: 1.693738, amountCents: 30000, currentValueCents: 33380 },
  { id: "siemens_energy", shares: 1.313068, amountCents: 18000, currentValueCents: 22459 },
];

export function getAssetById(id: string) {
  return PORTFOLIO_ASSETS.find((a) => a.id === id);
}

export function getAssetsWithSavingsPlan() {
  return PORTFOLIO_ASSETS.filter((a) => a.monthlyPlanCents > 0);
}
