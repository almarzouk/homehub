import mongoose, { Schema, Model } from "mongoose";

export interface ISavingsPlan {
  assetId: string;
  ticker: string;
  title: string;
  monthlyAmount: number;
  dayOfMonth: number;
  isActive: boolean;
  lastExecutedMonth?: string;
  createdAt: Date;
  updatedAt: Date;
}

const savingsPlanSchema = new Schema<ISavingsPlan>(
  {
    assetId: { type: String, required: true, unique: true },
    ticker: { type: String, required: true },
    title: { type: String, required: true },
    monthlyAmount: { type: Number, required: true },
    dayOfMonth: { type: Number, default: 1, min: 1, max: 28 },
    isActive: { type: Boolean, default: true },
    lastExecutedMonth: { type: String },
  },
  { timestamps: true }
);

const SavingsPlan: Model<ISavingsPlan> =
  mongoose.models.SavingsPlan ??
  mongoose.model<ISavingsPlan>("SavingsPlan", savingsPlanSchema);

export default SavingsPlan;
