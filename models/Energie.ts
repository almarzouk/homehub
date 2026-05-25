import mongoose, { Schema, type Document, Types } from "mongoose";

export interface IEnergie extends Document {
  householdId: Types.ObjectId;
  typ: "strom" | "gas" | "wasser" | "heizung" | "sonstige";
  monat: number;
  jahr: number;
  verbrauch: number;
  einheit: string;
  kosten?: number;
  zaehlerstand?: number;
  notizen?: string;
  createdAt: Date;
  updatedAt: Date;
}

const energieSchema = new Schema<IEnergie>(
  {
    householdId: { type: Schema.Types.ObjectId, required: true, index: true },
    typ: {
      type: String,
      required: true,
      enum: ["strom", "gas", "wasser", "heizung", "sonstige"],
    },
    monat: { type: Number, required: true, min: 1, max: 12 },
    jahr: { type: Number, required: true, min: 2000, max: 2100 },
    verbrauch: { type: Number, required: true, min: 0 },
    einheit: { type: String, required: true, default: "kWh", maxlength: 20 },
    kosten: { type: Number, min: 0 },
    zaehlerstand: { type: Number, min: 0 },
    notizen: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

energieSchema.index({ householdId: 1, typ: 1, jahr: 1, monat: 1 }, { unique: true });

export default mongoose.models.Energie ?? mongoose.model<IEnergie>("Energie", energieSchema);
