import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ILocationDocument extends Document {
  name: string;
  icon?: string;
  color?: string;
  householdId?: Types.ObjectId;
}

const LocationSchema = new Schema<ILocationDocument>(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: "📦" },
    color: { type: String, default: "#6b7280" },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

const Location: Model<ILocationDocument> =
  mongoose.models.Location ||
  mongoose.model<ILocationDocument>("Location", LocationSchema);

export default Location;
