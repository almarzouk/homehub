import mongoose, { Schema, Model } from "mongoose";
import type { Allocation } from "@/types";

export interface ISalaryConfig {
  amount: number;
  currency: string;
  month: string;
  allocations: Allocation[];
  createdAt: Date;
}

const allocationSchema = new Schema(
  {
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, enum: ["fixed", "investment", "savings", "variable"], required: true },
  },
  { _id: false }
);

const salaryConfigSchema = new Schema<ISalaryConfig>(
  {
    amount: { type: Number, required: true },
    currency: { type: String, default: "EUR" },
    month: { type: String, required: true, index: true },
    allocations: [allocationSchema],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

salaryConfigSchema.index({ month: 1 }, { unique: true });

const SalaryConfig: Model<ISalaryConfig> =
  mongoose.models.SalaryConfig ??
  mongoose.model<ISalaryConfig>("SalaryConfig", salaryConfigSchema);

export default SalaryConfig;
