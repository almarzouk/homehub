import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ICategoryDocument extends Document {
  name: string;
  color?: string;
  householdId?: Types.ObjectId;
}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, trim: true },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

const Category: Model<ICategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<ICategoryDocument>("Category", CategorySchema);

export default Category;
