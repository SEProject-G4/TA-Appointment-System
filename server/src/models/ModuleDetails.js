const mongoose = require("mongoose");

const moduleDetailsSchema = new mongoose.Schema(
  {
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
    recruitmentSeriesId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      trim: true,
    },
    semester: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
    },
    // Array of Google ID strings for coordinators
    coordinators: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      default: [],
    },
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
      default: null,
      min: 0,
    },
    requiredUndergraduateTACount: {
      type: Number,
      required: false,
      default: null,
      min: 0,
    },
    requiredPostgraduateTACount: {
      type: Number,
      required: false,
      default: null,
      min: 0,
    },
    appliedUndergraduateCount: {
      type: Number,
      required: false,
      default: null,
      min: 0,
    },
    appliedPostgraduateCount: {
      type: Number,
      required: false,
      default: null,
      min: 0,
    },
    requirements: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    moduleStatus: {
      type: String,
      required: true,
      default: "initialised",
      enum: ["initialised", "pending changes", "changes submitted", "advertised", "full", "getting documents", "closed"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ModuleDetails",
  moduleDetailsSchema,
  "moduledetails"
);
