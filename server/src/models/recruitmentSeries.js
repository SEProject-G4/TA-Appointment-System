const mongoose = require("mongoose");

const recruitmentSeriesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  applicationDueDate: {
    type: Date,
    required: true,
  },
  documentDueDate: {
    type: Date,
    required: true,
  },
  undergradHourLimit: {
    type: Number,
    required: true,
    min: 0,
  },
  postgradHourLimit: {
    type: Number,
    required: true,
    min: 0,
  },
  undergradMailingList: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "UserGroup", // or whatever collection/group ref
    required: false,
    default: [],
  },
  postgradMailingList: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "UserGroup",
    required: false,
    default: [],
  },
  status: {
    type: String,
    required: true,
    enum: ["initialised", "Closed"],
    default: "Open",
  },
});

module.exports = mongoose.model("RecruitmentSeries", recruitmentSeriesSchema);
