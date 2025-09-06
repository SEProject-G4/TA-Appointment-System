const mongoose = require('mongoose');

const recruitmentSeriesSchema = new mongoose.Schema({
  name: { type: String, required: true },
  applicationDueDate: { type: Date, required: true },
  documentDueDate: { type: Date, required: true },
  undergradHourLimit: { type: Number, required: true },
  postgradHourLimit: { type: Number, required: true },
  undergradMailingList: [
    { type: mongoose.Schema.Types.ObjectId, ref: "UserGroup" },
  ],
  postgradMailingList: [
    { type: mongoose.Schema.Types.ObjectId, ref: "UserGroup" },
  ],
  status: { type: String, enum: ['initialised', 'published', 'archived'], default: 'initialised' }
});

module.exports = mongoose.model("RecruitmentSeries", recruitmentSeriesSchema);