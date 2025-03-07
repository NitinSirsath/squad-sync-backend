import mongoose, { Schema, Document } from "mongoose";

interface Organization extends Document {
  name: string;
  createdBy?: mongoose.Types.ObjectId; // ✅ Can be null initially
  admins: mongoose.Types.ObjectId[];
  membersCount: number;
  industry?: string;
  logo?: string;
  settings?: {
    allowGuestUsers: boolean;
    defaultRole: "employee" | "manager";
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<Organization>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null }, // ✅ Optional at first
    admins: [{ type: Schema.Types.ObjectId, ref: "User", unique: true }], // ✅ Store admin IDs
    membersCount: { type: Number, default: 1 },
    industry: { type: String, default: "" },
    logo: { type: String, default: "" },
    settings: {
      allowGuestUsers: { type: Boolean, default: false },
      defaultRole: {
        type: String,
        enum: ["employee", "manager"],
        default: "employee",
      },
    },
  },
  { timestamps: true }
);

const OrganizationModel = mongoose.model<Organization>(
  "Organization",
  OrganizationSchema
);

export default OrganizationModel;
