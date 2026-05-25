import mongoose, { Schema, type Document, Types } from "mongoose";

export interface IReinigung extends Document {
  householdId: Types.ObjectId;
  bereich: string;
  aufgabe: string;
  haeufigkeit: "taeglich" | "woechentlich" | "zweiwochentlich" | "monatlich" | "vierteljaehrlich";
  zugewiesen?: string;
  letzteErledigung?: Date;
  naechsteFaelligkeit?: Date;
  erledigt: boolean;
  notizen?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reinigungSchema = new Schema<IReinigung>(
  {
    householdId: { type: Schema.Types.ObjectId, required: true, index: true },
    bereich: { type: String, required: true, trim: true, maxlength: 80 },
    aufgabe: { type: String, required: true, trim: true, maxlength: 200 },
    haeufigkeit: {
      type: String,
      enum: ["taeglich", "woechentlich", "zweiwochentlich", "monatlich", "vierteljaehrlich"],
      default: "woechentlich",
    },
    zugewiesen: { type: String, trim: true },
    letzteErledigung: { type: Date },
    naechsteFaelligkeit: { type: Date },
    erledigt: { type: Boolean, default: false },
    notizen: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

export default mongoose.models.Reinigung ?? mongoose.model<IReinigung>("Reinigung", reinigungSchema);
