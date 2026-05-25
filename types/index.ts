export type AllocationCategory = "fixed" | "investment" | "savings" | "variable";
export type ExpenseType = "necessary" | "unnecessary" | "investment";
export type AlertType = "warning" | "info" | "danger";

export interface Allocation {
  label: string;
  amount: number;
  category: AllocationCategory;
}

export interface ExpenseDTO {
  _id: string;
  title: string;
  amount: number;
  category: string;
  type: ExpenseType;
  date: string;
  note?: string;
  isWarning: boolean;
  createdAt: string;
}

export interface InvestmentDTO {
  _id: string;
  title: string;
  amount: number;
  currentValue: number;
  type: string;
  startDate: string;
  note?: string;
  ticker?: string;
  shares?: number;
  priceEur?: number;
  assetId?: string;
  createdAt: string;
}

export interface AlertDTO {
  _id: string;
  title: string;
  message: string;
  type: AlertType;
  category: string;
  isRead: boolean;
  createdAt: string;
}

export interface SalaryConfigDTO {
  _id: string;
  amount: number;
  currency: string;
  month: string;
  allocations: Allocation[];
  createdAt: string;
}
