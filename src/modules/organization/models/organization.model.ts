import mongoose, { Schema, Document } from "mongoose";

interface OrganizationMember {
  userId: mongoose.Types.ObjectId;
  role: "admin" | "manager" | "employee";
  joinedAt: Date;
}

export interface Organization extends Document {
  name: string;
  admin: mongoose.Types.ObjectId; // ✅ Only one admin
  members: OrganizationMember[]; // ✅ Store user details instead of just IDs
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
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true }, // ✅ Only one admin
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: {
          type: String,
          enum: ["admin", "manager", "employee"],
          required: true,
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ], // ✅ Store more details in `members`
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
