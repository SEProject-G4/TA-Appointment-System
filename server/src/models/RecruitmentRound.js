const mongoose = require('mongoose');

const recruitmentRoundSchema = new mongoose.Schema({
    name: {type:String, required:true, trim:true},
    applicationDueDate: {type:Date, required:true},
    documentDueDate: {type:Date, required:true},
    undergradHourLimit: {type:Number, required:true, min:0},
    postgradHourLimit: {type:Number, required:true, min:0},
    status: {type:String, enum:['initialised', 'active', 'closed', 'archived'], default:'initialised'},
    undergradMailingList: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserGroup" }],
    postgradMailingList: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserGroup" }],
    moduleCount: {type:Number, default:0, min:0},
    undergraduateTAPositionsCount: {type:Number, default:0, min:0},
    postgraduateTAPositionsCount: {type:Number, default:0, min:0}
});

module.exports = mongoose.model("RecruitmentRound", recruitmentRoundSchema, "recruitmentrounds");