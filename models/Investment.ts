import mongoose, { Schema, Model } from "mongoose";

export interface IInvestment {
  title: string;
  amount: number;
  currentValue: number;
  type: string;
  startDate: Date;
  note?: string;
  ticker?: string;
  shares?: number;
  priceEur?: number;
  lastPriceUpdate?: Date;
  assetId?: string;
  householdId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const investmentSchema = new Schema<IInvestment>(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    type: { type: String, required: true },
    startDate: { type: Date, required: true },
    note: { type: String },
    ticker: { type: String, index: true },
    shares: { type: Number },
    priceEur: { type: Number },
    lastPriceUpdate: { type: Date },
    assetId: { type: String, index: true },
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const MODEL_NAME = "Investment";
if (mongoose.models[MODEL_NAME] && !mongoose.models[MODEL_NAME].schema.path("householdId")) {
  mongoose.deleteModel(MODEL_NAME);
}

const Investment: Model<IInvestment> =
  mongoose.models[MODEL_NAME] ??
  mongoose.model<IInvestment>(MODEL_NAME, investmentSchema);

export default Investment;
