import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  householdId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: String,
    url: String,
    householdId: { type: Schema.Types.ObjectId, ref: "Household", index: true },
  },
  { timestamps: true }
);

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
