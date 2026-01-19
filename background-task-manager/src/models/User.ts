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
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
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
    required: true,
  },
  indexNumber: {
    type: String,
    required: function (this: IUser) {
      return this.role === "undergraduate" || this.role === "postgraduate";
    },
    default: undefined,
  },
  userGroup: {
    type: Schema.Types.ObjectId,
    ref: "UserGroup",
    required: true,
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

// Compound unique index for email+role combination
userSchema.index({ email: 1, role: 1 }, { unique: true });

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema, "users");

module.exports = User;
