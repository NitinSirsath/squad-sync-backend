import mongoose, { Schema, Document } from "mongoose";

export interface BugReport extends Document {
  title: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  reportedBy: mongoose.Types.ObjectId; // Reference to User model
  organization: mongoose.Types.ObjectId; // Track which organization it belongs to
  status: "open" | "in-progress" | "fixed"; // Track bug progress
  createdAt: Date;
  updatedAt: Date;
}

const BugReportSchema = new Schema<BugReport>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    description: { type: String, required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Link to User who reported the bug
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    }, // Organization reference
    status: {
      type: String,
      enum: ["open", "in-progress", "fixed"],
      default: "open",
    },
  },
  { timestamps: true }
);

// Index for faster queries
BugReportSchema.index({ title: 1 });
BugReportSchema.index({ reportedBy: 1 });
BugReportSchema.index({ organization: 1 });

const BugReportModel = mongoose.model<BugReport>("BugReport", BugReportSchema);

export default BugReportModel;
