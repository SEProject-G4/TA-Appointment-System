import mongoose = require("mongoose");
import { Schema, Document, Model } from "mongoose";

export interface IUserGroup extends Document {
  name: string;
  groupType: "undergraduate" | "postgraduate" | "lecturer" | "hod" | "cse-office" | "admin";
  userCount: number;
}

const userGroupSchema = new Schema<IUserGroup>({
  name: { type: String, required: true },
  groupType: {
    type: String,
    enum: [
      "undergraduate",
      "postgraduate",
      "lecturer",
      "hod",
      "cse-office",
      "admin",
    ],
    required: true,
  },
  userCount: { type: Number, default: 0 },
});

userGroupSchema.index({ name: 1, groupType: 1 }, { unique: true });

const UserGroup: Model<IUserGroup> = mongoose.model<IUserGroup>("UserGroup", userGroupSchema);

module.exports = UserGroup;
