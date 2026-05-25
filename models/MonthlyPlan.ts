import mongoose, { Schema, Model } from "mongoose";
import type { Allocation, ExpenseType } from "@/types";
import type { PlanFixedItem, EmergencyFundSettings } from "@/lib/monthly-plan-items";

export interface IRecurringExpense {
  title: string;
  amount: number;
  category: string;
  type: ExpenseType;
  dayOfMonth: number;
}

export interface IMonthlyPlan {
  isActive: boolean;
  salaryAmount: number;
  currency: string;
  fixedItems: PlanFixedItem[];
  emergencyFund: EmergencyFundSettings;
  allocations: Allocation[];
  recurringExpenses: IRecurringExpense[];
  lastExecutedMonth?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fixedItemSchema = new Schema(
  {
    id: { type: String, required: true },
    amount: { type: Number, default: 0 },
    dayOfMonth: { type: Number, default: 1, min: 1, max: 28 },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const emergencyFundSchema = new Schema(
  {
    monthlyDeposit: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    dayOfMonth: { type: Number, default: 1, min: 1, max: 28 },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const recurringSchema = new Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    type: { type: String, enum: ["necessary", "unnecessary", "investment"], required: true },
    dayOfMonth: { type: Number, required: true, min: 1, max: 28 },
  },
  { _id: false }
);

const allocationSchema = new Schema(
  {
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, enum: ["fixed", "investment", "savings", "variable"], required: true },
  },
  { _id: false }
);

const monthlyPlanSchema = new Schema<IMonthlyPlan>(
  {
    isActive: { type: Boolean, default: true },
    salaryAmount: { type: Number, required: true },
    currency: { type: String, default: "EUR" },
    fixedItems: { type: [fixedItemSchema], default: [] },
    emergencyFund: {
      type: emergencyFundSchema,
      default: () => ({ monthlyDeposit: 0, balance: 0, dayOfMonth: 1, enabled: true }),
    },
    allocations: [allocationSchema],
    recurringExpenses: [recurringSchema],
    lastExecutedMonth: { type: String },
  },
  { timestamps: true }
);

const MonthlyPlan: Model<IMonthlyPlan> =
  mongoose.models.MonthlyPlan ??
  mongoose.model<IMonthlyPlan>("MonthlyPlan", monthlyPlanSchema);

export default MonthlyPlan;
