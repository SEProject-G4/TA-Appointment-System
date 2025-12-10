import mongoose = require("mongoose");
import { Schema, Document, Model } from "mongoose";

export interface IRecruitmentRound extends Document {
  name: string;
  applicationDueDate: Date;
  documentDueDate: Date;
  undergradHourLimit: number;
  postgradHourLimit: number;
  status: "initialised" | "active" | "closed" | "archived";
  undergradMailingList: mongoose.Types.ObjectId[];
  postgradMailingList: mongoose.Types.ObjectId[];
  moduleCount: number;
  undergraduateTAPositionsCount: number;
  postgraduateTAPositionsCount: number;
}

const recruitmentRoundSchema = new Schema<IRecruitmentRound>({
  name: { type: String, required: true, trim: true },
  applicationDueDate: { type: Date, required: true },
  documentDueDate: { type: Date, required: true },
  undergradHourLimit: { type: Number, required: true, min: 0 },
  postgradHourLimit: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["initialised", "active", "closed", "archived"],
    default: "initialised",
  },
  undergradMailingList: [{ type: Schema.Types.ObjectId, ref: "UserGroup" }],
  postgradMailingList: [{ type: Schema.Types.ObjectId, ref: "UserGroup" }],
  moduleCount: { type: Number, default: 0, min: 0 },
  undergraduateTAPositionsCount: { type: Number, default: 0, min: 0 },
  postgraduateTAPositionsCount: { type: Number, default: 0, min: 0 },
});

const RecruitmentRound: Model<IRecruitmentRound> = mongoose.model<IRecruitmentRound>(
  "RecruitmentRound",
  recruitmentRoundSchema,
  "recruitmentrounds"
);

module.exports = RecruitmentRound;
