import mongoose, { Document, Schema, Types } from "mongoose";

export interface IHaushaltAufgabe extends Document {
  titel: string;
  beschreibung?: string;
  kategorie: "reinigung" | "wartung" | "einkauf" | "sonstiges";
  prioritaet: "hoch" | "mittel" | "niedrig";
  erledigt: boolean;
  wiederholung?: "taeglich" | "woechentlich" | "monatlich" | "nein";
  faelligAm?: Date;
  erledigtAm?: Date;
  userId: Types.ObjectId;
  householdId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HaushaltAufgabeSchema = new Schema<IHaushaltAufgabe>(
  {
    titel: { type: String, required: true, trim: true },
    beschreibung: { type: String, trim: true },
    kategorie: { type: String, enum: ["reinigung", "wartung", "einkauf", "sonstiges"], default: "sonstiges" },
    prioritaet: { type: String, enum: ["hoch", "mittel", "niedrig"], default: "mittel" },
    erledigt: { type: Boolean, default: false },
    wiederholung: { type: String, enum: ["taeglich", "woechentlich", "monatlich", "nein"], default: "nein" },
    faelligAm: { type: Date },
    erledigtAm: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

export default mongoose.models.HaushaltAufgabe ||
  mongoose.model<IHaushaltAufgabe>("HaushaltAufgabe", HaushaltAufgabeSchema);
