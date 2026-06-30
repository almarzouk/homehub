import mongoose, { Document, Schema, Types } from "mongoose";

export type KasseKategorie = "lebensmittel" | "transport" | "restaurant" | "kind" | "kleidung" | "gesundheit" | "haushalt" | "freizeit" | "sonstiges";

export interface IHaushaltskasse extends Document {
  betrag: number;
  kategorie: KasseKategorie;
  beschreibung: string;
  datum: Date;
  bezahltVon?: string;
  notiz?: string;
  userId: Types.ObjectId;
  householdId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const HaushaltskasseSchema = new Schema<IHaushaltskasse>(
  {
    betrag: { type: Number, required: true },
    kategorie: { type: String, enum: ["lebensmittel","transport","restaurant","kind","kleidung","gesundheit","haushalt","freizeit","sonstiges"], default: "sonstiges" },
    beschreibung: { type: String, required: true, trim: true },
    datum: { type: Date, required: true, default: Date.now },
    bezahltVon: { type: String, trim: true },
    notiz: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Haushaltskasse ||
  mongoose.model<IHaushaltskasse>("Haushaltskasse", HaushaltskasseSchema);
