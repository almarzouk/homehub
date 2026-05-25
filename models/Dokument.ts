import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDokument extends Document {
  titel: string;
  kategorie: "vertrag" | "garantie" | "versicherung" | "ausweis" | "gesundheit" | "sonstiges";
  beschreibung?: string;
  bild: string;           // base64 data URI
  ablaufdatum?: Date;
  userId: Types.ObjectId;
  householdId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DokumentSchema = new Schema<IDokument>(
  {
    titel: { type: String, required: true, trim: true },
    kategorie: { type: String, enum: ["vertrag", "garantie", "versicherung", "ausweis", "gesundheit", "sonstiges"], default: "sonstiges" },
    beschreibung: { type: String, trim: true },
    bild: { type: String, required: true },
    ablaufdatum: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Dokument ||
  mongoose.model<IDokument>("Dokument", DokumentSchema);
