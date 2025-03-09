import mongoose, { Schema, Document } from "mongoose";

export interface Organization extends Document {
  name: string;
  admin: mongoose.Types.ObjectId; // ✅ Only one admin (no array)
  members: mongoose.Types.ObjectId[]; // ✅ Store members
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
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true }, // ✅ No unique constraint
    members: [{ type: Schema.Types.ObjectId, ref: "User" }], // ✅ Track members
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

// ✅ Ensure `admin` is NOT indexed as unique
OrganizationSchema.index({ admin: 1 }, { unique: false });

const OrganizationModel = mongoose.model<Organization>(
  "Organization",
  OrganizationSchema
);

export default OrganizationModel;
