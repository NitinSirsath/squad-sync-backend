import mongoose, { Schema, Document } from "mongoose";

export interface OrganizationMembership {
  orgId: mongoose.Types.ObjectId;
  role: "admin" | "manager" | "employee";
}

export interface User extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  role: "admin" | "manager" | "employee"; // ✅ Added role field
  organizations: OrganizationMembership[]; // ✅ Multiple Organizations
  activeOrg?: mongoose.Types.ObjectId; // ✅ Track user's active organization
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<User>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    password: { type: String, required: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    profilePicture: { type: String, default: "" },
    organizations: [
      {
        orgId: { type: Schema.Types.ObjectId, ref: "Organization" },
        role: {
          type: String,
          enum: ["admin", "manager", "employee"],
          required: true,
        },
      },
    ],
    activeOrg: { type: Schema.Types.ObjectId, ref: "Organization" },
  },
  { timestamps: true }
);

// ✅ Keep only one set of indexes
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ "organizations.orgId": 1 }); // ✅ Optimize org-based lookups

const UserModel = mongoose.model<User>("User", UserSchema);

export default UserModel;
