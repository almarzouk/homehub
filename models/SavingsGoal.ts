import mongoose, { Schema, Model } from "mongoose";

export interface IDeposit {
  amount: number;
  note?: string;
  date: Date;
}

export interface ISavingsGoal {
  name: string;
  emoji: string;
  targetAmount: number;
  currentBalance: number;
  monthlyDeposit: number;
  currency: string;
  isActive: boolean;
  isPrimary: boolean;
  color: string;
  deposits: IDeposit[];
  deadline?: Date;
  note?: string;
  householdId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const depositSchema = new Schema<IDeposit>(
  {
    amount: { type: Number, required: true },
    note: { type: String },
    date: { type: Date, default: Date.now },
  },
  { _id: true }
);

const savingsGoalSchema = new Schema<ISavingsGoal>(
  {
    name: { type: String, required: true },
    emoji: { type: String, default: "🎯" },
    targetAmount: { type: Number, required: true },
    currentBalance: { type: Number, default: 0 },
    monthlyDeposit: { type: Number, default: 0 },
    currency: { type: String, default: "EUR" },
    isActive: { type: Boolean, default: true },
    isPrimary: { type: Boolean, default: false },
    color: { type: String, default: "amber" },
    deposits: { type: [depositSchema], default: [] },
    deadline: { type: Date },
    note: { type: String },
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

savingsGoalSchema.index({ isPrimary: 1 });

const SavingsGoal: Model<ISavingsGoal> =
  mongoose.models.SavingsGoal ??
  mongoose.model<ISavingsGoal>("SavingsGoal", savingsGoalSchema);

export default SavingsGoal;
