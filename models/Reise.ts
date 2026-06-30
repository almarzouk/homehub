import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReiseCheckItem {
  _id: Types.ObjectId;
  text: string;
  erledigt: boolean;
}

export interface IReise extends Document {
  name: string;
  ziel: string;
  startDatum?: Date;
  endDatum?: Date;
  budget?: number;
  waehrung: string;
  teilnehmer?: string;
  notizen?: string;
  checkliste: IReiseCheckItem[];
  status: "geplant" | "aktiv" | "abgeschlossen";
  userId: Types.ObjectId;
  householdId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CheckItemSchema = new Schema<IReiseCheckItem>({
  text: { type: String, required: true, trim: true },
  erledigt: { type: Boolean, default: false },
});

const ReiseSchema = new Schema<IReise>(
  {
    name: { type: String, required: true, trim: true },
    ziel: { type: String, required: true, trim: true },
    startDatum: { type: Date },
    endDatum: { type: Date },
    budget: { type: Number },
    waehrung: { type: String, default: "EUR" },
    teilnehmer: { type: String, trim: true },
    notizen: { type: String, trim: true },
    checkliste: { type: [CheckItemSchema], default: [] },
    status: { type: String, enum: ["geplant","aktiv","abgeschlossen"], default: "geplant" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Reise ||
  mongoose.model<IReise>("Reise", ReiseSchema);
