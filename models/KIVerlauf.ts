import mongoose, { Schema, models, model } from "mongoose";

export interface IKIVerlauf {
  _id: string;
  typ: "wochenplan" | "was-kochen";
  titel: string;
  eingabe: Record<string, unknown>;
  ergebnis: unknown[];
  tokenGeschaetzt: number;
  householdId?: string;
  userId?: string;
  createdAt: Date;
}

const KIVerlaufSchema = new Schema<IKIVerlauf>(
  {
    typ: { type: String, enum: ["wochenplan", "was-kochen"], required: true },
    titel: { type: String, required: true },
    eingabe: { type: Schema.Types.Mixed, default: {} },
    ergebnis: { type: [Schema.Types.Mixed], default: [] },
    tokenGeschaetzt: { type: Number, default: 0 },
    householdId: { type: String },
    userId: { type: String },
  },
  { timestamps: true }
);

export default models.KIVerlauf ||
  model<IKIVerlauf>("KIVerlauf", KIVerlaufSchema);
