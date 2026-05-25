import mongoose, { Schema, type Document, Types } from "mongoose";

export interface IFitnessEintrag extends Document {
  householdId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  typ: "gewicht" | "training" | "schritte" | "schlaf" | "sonstige";
  datum: Date;
  wert: number;
  einheit: string;
  dauer?: number;
  notizen?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fitnessEintragSchema = new Schema<IFitnessEintrag>(
  {
    householdId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    userName: { type: String, required: true, maxlength: 80 },
    typ: {
      type: String,
      required: true,
      enum: ["gewicht", "training", "schritte", "schlaf", "sonstige"],
    },
    datum: { type: Date, required: true },
    wert: { type: Number, required: true, min: 0 },
    einheit: { type: String, required: true, maxlength: 20 },
    dauer: { type: Number, min: 0 },
    notizen: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

fitnessEintragSchema.index({ householdId: 1, userId: 1, datum: -1 });

export default mongoose.models.FitnessEintrag ?? mongoose.model<IFitnessEintrag>("FitnessEintrag", fitnessEintragSchema);
