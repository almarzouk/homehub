import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMedikament extends Document {
  name: string;
  wirkstoff?: string;
  dosierung: string;
  einheit: "mg" | "ml" | "tablette" | "kapsel" | "tropfen" | "sonstiges";
  vorrat: number;
  mindestvorrat: number;
  ablaufdatum?: Date;
  einnahmezeiten: string[];  // z.B. ["morgens", "abends"]
  einnahmehinweis?: string;
  bild?: string;
  erinnerung: boolean;
  userId: Types.ObjectId;
  householdId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MedikamentSchema = new Schema<IMedikament>(
  {
    name: { type: String, required: true, trim: true },
    wirkstoff: { type: String, trim: true },
    dosierung: { type: String, required: true },
    einheit: { type: String, enum: ["mg", "ml", "tablette", "kapsel", "tropfen", "sonstiges"], default: "tablette" },
    vorrat: { type: Number, default: 0, min: 0 },
    mindestvorrat: { type: Number, default: 5, min: 0 },
    ablaufdatum: { type: Date },
    einnahmezeiten: [{ type: String }],
    einnahmehinweis: { type: String, trim: true },
    bild: { type: String },
    erinnerung: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Medikament ||
  mongoose.model<IMedikament>("Medikament", MedikamentSchema);
