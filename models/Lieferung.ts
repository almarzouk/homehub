import mongoose, { Schema, type Document, Types } from "mongoose";

export interface ILieferung extends Document {
  householdId: Types.ObjectId;
  bezeichnung: string;
  haendler?: string;
  trackingNummer?: string;
  trackingUrl?: string;
  status: "bestellt" | "versendet" | "unterwegs" | "zugestellt" | "abgeholt" | "problem";
  bestelldatum?: Date;
  erwarteteAnkunft?: Date;
  angekommendAm?: Date;
  empfaenger?: string;
  notizen?: string;
  createdAt: Date;
  updatedAt: Date;
}

const lieferungSchema = new Schema<ILieferung>(
  {
    householdId: { type: Schema.Types.ObjectId, required: true, index: true },
    bezeichnung: { type: String, required: true, trim: true, maxlength: 200 },
    haendler: { type: String, trim: true, maxlength: 100 },
    trackingNummer: { type: String, trim: true, maxlength: 100 },
    trackingUrl: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ["bestellt", "versendet", "unterwegs", "zugestellt", "abgeholt", "problem"],
      default: "bestellt",
    },
    bestelldatum: { type: Date },
    erwarteteAnkunft: { type: Date },
    angekommendAm: { type: Date },
    empfaenger: { type: String, trim: true, maxlength: 60 },
    notizen: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

lieferungSchema.index({ householdId: 1, createdAt: -1 });

export default mongoose.models.Lieferung ?? mongoose.model<ILieferung>("Lieferung", lieferungSchema);
