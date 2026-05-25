import mongoose, { Schema, Model } from "mongoose";
import type { AlertType } from "@/types";

export interface IFinanzAlert {
  title: string;
  message: string;
  type: AlertType;
  category: string;
  isRead: boolean;
  createdAt: Date;
}

const finanzAlertSchema = new Schema<IFinanzAlert>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["warning", "info", "danger"], required: true },
    category: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Use "FinanzAlert" to avoid collision with any potential future generic Alert model
const FinanzAlert: Model<IFinanzAlert> =
  mongoose.models.FinanzAlert ??
  mongoose.model<IFinanzAlert>("FinanzAlert", finanzAlertSchema);

export default FinanzAlert;
