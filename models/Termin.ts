import mongoose, { Schema, Document } from "mongoose";

export interface ITermin extends Document {
  userId: mongoose.Types.ObjectId;
  householdId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  location?: string;
  participants?: string[];
  category: "arzt" | "schule" | "freizeit" | "arbeit" | "geburtstag" | "sonstiges";
  color?: string;
  reminder?: number; // minutes before
  createdAt: Date;
  updatedAt: Date;
}

const TerminSchema = new Schema<ITermin>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    time: { type: String },
    location: { type: String, trim: true },
    participants: [{ type: String }],
    category: {
      type: String,
      enum: ["arzt", "schule", "freizeit", "arbeit", "geburtstag", "sonstiges"],
      default: "sonstiges",
    },
    color: { type: String, default: "#3B82F6" },
    reminder: { type: Number }, // minutes before
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

TerminSchema.index({ userId: 1, date: 1 });

export default mongoose.models.Termin ||
  mongoose.model<ITermin>("Termin", TerminSchema);
