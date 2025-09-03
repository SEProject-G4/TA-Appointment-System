const mongoose = require("mongoose");

const taApplicationSchema = new mongoose.Schema({
    userId:{
        type: String,
        ref: "Users",
        trim: true,
        required: true
    },
    moduleId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "ModuleDetails",
        required: true
    },
    status:{
        type: String,
        required: true,
        default: "pending",
        enum: ["pending", "approved", "rejected"]
    }
}, { timestamps: true });

module.exports = mongoose.model("TAApplication", taApplicationSchema, "taapplications");
