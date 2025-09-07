const mongoose = require("mongoose");

const recruitmentSeriesSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        applicationDueDate: {
            type: Date,
            required: true
        },
        documentDueDate: {
            type: Date,
            required: true
        },
        undergradHourLimit: {
            type: Number,
            required: true,
            min: 0
        },
        postgradHourLimit: {
            type: Number,
            required: true,
            min: 0  
        },
        undergradMailingList: {
            type: [String],
            required: false,
            default: [],
            trim: true
        },
        postgradMailingList: {
            type: [String],
            required: false,
            default: [],
            trim: true
        },
        status: {
            type: String,
            required: true,
            enum: ['initialised', 'Closed'],
            default: 'Open'
        }
    }
);

module.exports = mongoose.model("RecruitmentSeries", recruitmentSeriesSchema);
 