import mongoose, { Schema, Document } from "mongoose";

export interface IKochgeraet extends Document {
  name: string;
  programme: string[];
  leistungen: string[];
  icon: string;
  hintergrund: string;
  rand: string;
  householdId?: mongoose.Types.ObjectId;
  erstelltAm: Date;
  aktualisiertAm: Date;
}

const KochgeraetSchema = new Schema<IKochgeraet>(
  {
    name: { type: String, required: true, trim: true },
    programme: { type: [String], default: [] },
    leistungen: { type: [String], default: [] },
    icon: { type: String, default: "utensils" },
    hintergrund: { type: String, default: "#ECEFF1" },
    rand: { type: String, default: "#607D8B" },
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: { createdAt: "erstelltAm", updatedAt: "aktualisiertAm" } }
);

KochgeraetSchema.index({ name: 1, householdId: 1 }, { unique: true });

// Re-register if schema changed (added householdId)
if (mongoose.models.Kochgeraet && !mongoose.models.Kochgeraet.schema.path("householdId")) {
  mongoose.deleteModel("Kochgeraet");
}

export default (mongoose.models.Kochgeraet as mongoose.Model<IKochgeraet>) ??
  mongoose.model<IKochgeraet>("Kochgeraet", KochgeraetSchema);
