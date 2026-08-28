import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDocTab extends Document {
  title: string;
  content: string;
  sortOrder: number;
  userId: Types.ObjectId;
  householdId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocTabSchema = new Schema<IDocTab>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

DocTabSchema.index({ householdId: 1, sortOrder: 1 });

export default mongoose.models.DocTab ||
  mongoose.model<IDocTab>("DocTab", DocTabSchema);
