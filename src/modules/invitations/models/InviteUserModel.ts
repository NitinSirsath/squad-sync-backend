import mongoose, { Schema, Document } from "mongoose";

export interface IInviteUser extends Document {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  invitedAt: Date;
}

const InviteUserSchema = new Schema<IInviteUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    invitedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const InviteUserModel = mongoose.model<IInviteUser>(
  "InviteUser",
  InviteUserSchema
);
export default InviteUserModel;
