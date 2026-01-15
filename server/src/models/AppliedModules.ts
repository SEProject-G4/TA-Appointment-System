import mongoose = require("mongoose");
import { Schema, Document, Model } from "mongoose";

// Interface for the AppliedModules document
export interface IAppliedModules extends Document {
  userId: mongoose.Types.ObjectId;
  recSeriesId: mongoose.Types.ObjectId;
  availableHoursPerWeek: number;
  appliedModules: mongoose.Types.ObjectId[];
  isDocSubmitted: boolean;
  Documents?: mongoose.Types.ObjectId;
}

const appliedModulesSchema = new Schema<IAppliedModules>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recSeriesId: {
    type: Schema.Types.ObjectId,
    ref: "RecruitmentRound",
    required: true,
  },
  availableHoursPerWeek: {
    type: Number,
    required: true,
    min: 0,
  },
  appliedModules: {
    type: [Schema.Types.ObjectId],
    ref: "TAApplication",
    required: true,
    default: [],
  },
  isDocSubmitted: {
    type: Boolean,
    required: true,
    default: false,
  },
  Documents: {
    type: Schema.Types.ObjectId,
    ref: "Document"
  },
});

const AppliedModules: Model<IAppliedModules> = mongoose.model<IAppliedModules>(
  "AppliedModules", 
  appliedModulesSchema, 
  "appliedmodules"
);

module.exports = AppliedModules;
