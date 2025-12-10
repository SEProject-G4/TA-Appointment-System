import mongoose = require("mongoose");
import { Schema, Document, Model } from "mongoose";

export interface ITaApplication extends Document {
  userId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const taApplicationSchema = new Schema<ITaApplication>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      trim: true,
      required: true,
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "ModuleDetails",
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "pending",
      enum: ["pending", "accepted", "rejected"],
    },
  },
  { timestamps: true }
);

const TAApplication: Model<ITaApplication> = mongoose.model<ITaApplication>(
  "TAApplication",
  taApplicationSchema,
  "taapplications"
);

module.exports = TAApplication;
