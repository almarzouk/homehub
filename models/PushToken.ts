import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPushToken extends Document {
  userId: mongoose.Types.ObjectId;
  householdId?: mongoose.Types.ObjectId;
  type: "web" | "expo";
  // Web push: full subscription JSON
  subscription?: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  // Expo push token
  expoToken?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PushTokenSchema = new Schema<IPushToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
    type: { type: String, enum: ["web", "expo"], required: true },
    subscription: {
      endpoint: String,
      keys: { p256dh: String, auth: String },
    },
    expoToken: String,
    userAgent: String,
  },
  { timestamps: true }
);

// One subscription per endpoint
PushTokenSchema.index({ "subscription.endpoint": 1 }, { sparse: true });
PushTokenSchema.index({ expoToken: 1 }, { sparse: true });

const PushToken: Model<IPushToken> =
  mongoose.models.PushToken || mongoose.model<IPushToken>("PushToken", PushTokenSchema);

export default PushToken;
