import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ModulePermission {
  view: boolean;
  edit: boolean;
}

export interface IHouseholdDocument extends Document {
  name: string;
  ownerId: Types.ObjectId;
  inviteCode: string;
  members: Types.ObjectId[];
  coAdmins: Types.ObjectId[];
  /** Keys of modules that are active for this household (empty = all active) */
  enabledModules: string[];
  /**
   * Per-member permission overrides.
   * Shape: { [userId: string]: { [moduleKey: string]: { view: boolean; edit: boolean } } }
   */
  memberPermissions: Record<string, Record<string, ModulePermission>>;
  createdAt: Date;
  updatedAt: Date;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const HouseholdSchema = new Schema<IHouseholdDocument>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    inviteCode: {
      type: String,
      unique: true,
      required: true,
      default: generateInviteCode,
      uppercase: true,
      trim: true,
    },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    coAdmins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    enabledModules: { type: [String], default: [] },
    memberPermissions: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

HouseholdSchema.index({ inviteCode: 1 }, { unique: true });

const Household: Model<IHouseholdDocument> =
  mongoose.models.Household ||
  mongoose.model<IHouseholdDocument>("Household", HouseholdSchema);

export default Household;
