import mongoose, { Schema, Document } from "mongoose";

export type SchwierigkeitsGrad = "einfach" | "mittel" | "schwer";

export interface IGericht extends Document {
  name: string;
  kochgeraet: string;
  programm: string;
  leistung: string;
  zeit: string;
  zeitMinuten?: number;
  portionen?: number;
  schwierigkeit?: SchwierigkeitsGrad;
  zutaten: string[];
  tags: string[];
  notizen: string;
  rezeptUrl?: string;
  favorit: boolean;
  gekochtAnzahl: number;
  zuletztGekocht?: Date | null;
  householdId?: mongoose.Types.ObjectId;
  erstelltAm: Date;
  aktualisiertAm: Date;
}

const GerichtSchema = new Schema<IGericht>(
  {
    name: { type: String, required: true, trim: true, index: true },
    kochgeraet: { type: String, required: true, index: true },
    programm: { type: String, default: "" },
    leistung: { type: String, default: "" },
    zeit: { type: String, default: "" },
    zeitMinuten: { type: Number, min: 0 },
    portionen: { type: Number, min: 1 },
    schwierigkeit: { type: String, enum: ["einfach", "mittel", "schwer"] },
    zutaten: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    notizen: { type: String, default: "" },
    rezeptUrl: { type: String, default: "" },
    favorit: { type: Boolean, default: false, index: true },
    gekochtAnzahl: { type: Number, default: 0, min: 0 },
    zuletztGekocht: { type: Date, default: null },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: { createdAt: "erstelltAm", updatedAt: "aktualisiertAm" } }
);

export default (mongoose.models.Gericht as mongoose.Model<IGericht>) ||
  mongoose.model<IGericht>("Gericht", GerichtSchema);
