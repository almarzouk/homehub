import mongoose, { Schema, type Document, Types } from "mongoose";

export interface IChatNachricht extends Document {
  householdId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  text: string;
  createdAt: Date;
}

const chatNachrichtSchema = new Schema<IChatNachricht>(
  {
    householdId: { type: Schema.Types.ObjectId, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderName: { type: String, required: true, maxlength: 80 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

chatNachrichtSchema.index({ householdId: 1, createdAt: -1 });

export default mongoose.models.ChatNachricht ?? mongoose.model<IChatNachricht>("ChatNachricht", chatNachrichtSchema);
