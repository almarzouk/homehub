import mongoose, { Schema, Model } from "mongoose";
import type { ExpenseType } from "@/types";

export interface IExpense {
  title: string;
  amount: number;
  category: string;
  type: ExpenseType;
  date: Date;
  note?: string;
  isWarning: boolean;
  householdId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    type: { type: String, enum: ["necessary", "unnecessary", "investment"], required: true },
    date: { type: Date, required: true },
    note: { type: String },
    isWarning: { type: Boolean, default: false },
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense ?? mongoose.model<IExpense>("Expense", expenseSchema);

export default Expense;
