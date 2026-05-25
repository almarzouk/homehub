import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWunsch extends Document {
  name: string;
  beschreibung?: string;
  preis: number;            // in cents
  prioritaet: "hoch" | "mittel" | "niedrig";
  kategorie: string;
  link?: string;
  bild?: string;
  gekauft: boolean;
  gekauftAm?: Date;
  userId: Types.ObjectId;
  householdId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WunschSchema = new Schema<IWunsch>(
  {
    name: { type: String, required: true, trim: true },
    beschreibung: { type: String, trim: true },
    preis: { type: Number, default: 0, min: 0 },
    prioritaet: { type: String, enum: ["hoch", "mittel", "niedrig"], default: "mittel" },
    kategorie: { type: String, default: "Sonstiges", trim: true },
    link: { type: String, trim: true },
    bild: { type: String },
    gekauft: { type: Boolean, default: false },
    gekauftAm: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Wunsch ||
  mongoose.model<IWunsch>("Wunsch", WunschSchema);
