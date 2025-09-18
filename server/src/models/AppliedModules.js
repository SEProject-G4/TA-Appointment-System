const mongoose = require("mongoose");

const appliedModulesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recSeriesId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "RecSeries",
    required: true,
  },
  availableHoursPerWeek: {
    type: Number,
    required: true,
    min: 0,
  },
    appliedModules: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "TaApplications",
    required: true,
    default: [],
  },
  isDocSubmitted: {
    type: Boolean,
    required: true,
    default: false,
  },
  Documents: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "TaDocumentSubmission"
  },
    
});

// const AppliedModules = mongoose.model("AppliedModules", appliedModulesSchema, "appliedmodules");

module.exports = mongoose.model("AppliedModules", appliedModulesSchema, "appliedmodules");





