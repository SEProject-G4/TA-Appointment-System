import mongoose = require("mongoose");
import { Schema, Document, Model } from "mongoose";

interface IStudentCounts {
  required: number;
  remaining: number;
  applied: number;
  reviewed: number;
  accepted: number;
  docSubmitted: number;
  appointed: number;
}

export interface IModuleDetails extends Document {
  recruitmentSeriesId: mongoose.Types.ObjectId;
  moduleCode: string;
  moduleName: string;
  semester: number;
  coordinators: mongoose.Types.ObjectId[];
  applicationDueDate: Date;
  documentDueDate: Date;
  requiredTAHours: number;
  openForUndergraduates: boolean;
  openForPostgraduates: boolean;
  undergraduateCounts: IStudentCounts;
  postgraduateCounts: IStudentCounts;
  requirements: string;
  moduleStatus: "initialised" | "pending changes" | "changes submitted" | "advertised" | "full" | "getting documents" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const studentCountsSchema = new Schema<IStudentCounts>(
  {
    required: { type: Number, default: 0, min: 0 },
    remaining: { type: Number, default: 0, min: 0 },
    applied: { type: Number, default: 0, min: 0 },
    reviewed: { type: Number, default: 0, min: 0 },
    accepted: { type: Number, default: 0, min: 0 },
    docSubmitted: { type: Number, default: 0, min: 0 },
    appointed: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const moduleDetailsSchema = new Schema<IModuleDetails>(
  {
    recruitmentSeriesId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "RecruitmentRound",
    },
    moduleCode: {
      type: String,
      required: true,
      trim: true,
    },
    moduleName: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
      trim: true,
    },
    coordinators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        default: [],
      },
    ],
    applicationDueDate: {
      type: Date,
      required: true,
    },
    documentDueDate: {
      type: Date,
      required: true,
    },
    requiredTAHours: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    openForUndergraduates: {
      type: Boolean,
      required: true,
      default: false,
    },
    openForPostgraduates: {
      type: Boolean,
      required: true,
      default: false,
    },
    undergraduateCounts: {
      type: studentCountsSchema,
      default: function () {
        return {
          required: 0,
          remaining: 0,
          applied: 0,
          reviewed: 0,
          accepted: 0,
          docSubmitted: 0,
          appointed: 0,
        };
      },
    },
    postgraduateCounts: {
      type: studentCountsSchema,
      default: function () {
        return {
          required: 0,
          remaining: 0,
          applied: 0,
          reviewed: 0,
          accepted: 0,
          docSubmitted: 0,
          appointed: 0,
        };
      },
    },
    requirements: {
      type: String,
      required: false,
      default: "",
    },
    moduleStatus: {
      type: String,
      required: true,
      default: "initialised",
      enum: [
        "initialised",
        "pending changes",
        "changes submitted",
        "advertised",
        "full",
        "getting documents",
        "closed",
      ],
    },
  },
  { timestamps: true }
);

// Pre-validate hook to check all coordinators are lecturers
moduleDetailsSchema.pre("validate", async function (next) {
  if (Array.isArray(this.coordinators) && this.coordinators.length > 0) {
    const User = mongoose.model("User");
    const users = await User.find({
      _id: { $in: this.coordinators },
      role: "lecturer",
    }).select("_id");
    if (users.length !== this.coordinators.length) {
      const error = new mongoose.Error.ValidationError();
      error.addError(
        "coordinators",
        new mongoose.Error.ValidatorError({
          message: "All coordinators must be users with the lecturer role.",
          path: "coordinators",
          value: this.coordinators,
        })
      );
      return next(error);
    }
  }
  next();
});

const ModuleDetails: Model<IModuleDetails> = mongoose.model<IModuleDetails>(
  "ModuleDetails",
  moduleDetailsSchema,
  "moduledetails"
);

module.exports = ModuleDetails;
