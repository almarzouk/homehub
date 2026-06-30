import mongoose, { Schema, models } from "mongoose";

export interface IFixkosten {
  _id: string;
  name: string;
  betrag: number; // cents
  kategorie: string;
  faelligAm?: number; // day of month 1-31
  aktiv: boolean;
  householdId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FixkostenSchema = new Schema<IFixkosten>(
  {
    name: { type: String, required: true, trim: true },
    betrag: { type: Number, required: true, min: 0 },
    kategorie: { type: String, default: "sonstiges" },
    faelligAm: { type: Number, min: 1, max: 31 },
    aktiv: { type: Boolean, default: true },
    householdId: { type: Schema.Types.ObjectId, ref: "Household" },
  },
  { timestamps: true }
);

export default models.Fixkosten || mongoose.model<IFixkosten>("Fixkosten", FixkostenSchema);
