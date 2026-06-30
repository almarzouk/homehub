import mongoose, { Document, Schema, Types } from "mongoose";

export type BabyTyp = "stillen" | "flasche" | "schlaf" | "aufwachen" | "windel" | "gewicht" | "groesse" | "notiz";

export interface IBabyEintrag extends Document {
  typ: BabyTyp;
  zeitpunkt: Date;
  menge?: number;       // ml für Flasche, g für Gewicht, cm für Größe
  dauer?: number;       // Minuten für Stillen/Schlaf
  seite?: "links" | "rechts" | "beide";  // für Stillen
  windel?: "nass" | "schmutzig" | "beides";
  notiz?: string;
  userId: Types.ObjectId;
  householdId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BabyEintragSchema = new Schema<IBabyEintrag>(
  {
    typ: { type: String, enum: ["stillen","flasche","schlaf","aufwachen","windel","gewicht","groesse","notiz"], required: true },
    zeitpunkt: { type: Date, required: true, default: Date.now },
    menge: { type: Number },
    dauer: { type: Number },
    seite: { type: String, enum: ["links","rechts","beide"] },
    windel: { type: String, enum: ["nass","schmutzig","beides"] },
    notiz: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

export default mongoose.models.BabyEintrag ||
  mongoose.model<IBabyEintrag>("BabyEintrag", BabyEintragSchema);
