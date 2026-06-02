import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  isBlocked: boolean;
  isApproved: boolean;
  householdId?: Types.ObjectId;
  aiMonthlyLimit: number;
  aiRequestsThisMonth: number;
  aiRequestsMonth: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isBlocked: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
    // AI usage tracking
    aiMonthlyLimit: { type: Number, default: 10 },
    aiRequestsThisMonth: { type: Number, default: 0 },
    aiRequestsMonth: { type: String, default: "" }, // YYYY-MM
  },
  { timestamps: true }
);

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
