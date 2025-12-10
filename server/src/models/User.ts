import mongoose = require("mongoose");
import { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  displayName?: string;
  googleId?: string;
  name: string;
  email: string;
  profilePicture: string;
  role: "admin" | "undergraduate" | "postgraduate" | "lecturer" | "cse-office" | "hod";
  indexNumber?: string;
  userGroup: mongoose.Types.ObjectId;
  firstLogin: boolean;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  displayName: {
    type: String,
    required: function (this: IUser) {
      return this.role === "lecturer" || this.role === "hod";
    },
    default: undefined,
  },
  googleId: {
    type: String,
    sparse: true,
    // Remove unique constraint - same person can have multiple roles
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    // Remove unique constraint - we'll use compound unique index instead
  },
  profilePicture: {
    type: String,
    default: "https://www.gravatar.com/avatar?d=mp",
  },
  role: {
    type: String,
    enum: [
      "admin",
      "undergraduate",
      "postgraduate",
      "lecturer",
      "cse-office",
      "hod",
    ],
    default: "undergraduate",
    required: true,
  },
  indexNumber: {
    type: String,
    unique: true,
    sparse: true,
    required: function (this: IUser) {
      return this.role === "undergraduate" || this.role === "postgraduate";
    },
  },
  userGroup: {
    type: Schema.Types.ObjectId,
    ref: "UserGroup",
    required: true,
    sparse: true,
  },
  firstLogin: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound unique index for email + role combination
// This ensures one user per role per email address
userSchema.index({ email: 1, role: 1 }, { unique: true });

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

module.exports = User;
