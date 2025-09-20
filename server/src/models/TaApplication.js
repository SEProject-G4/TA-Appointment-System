const mongoose = require("mongoose");

const taApplicationSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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
        enum: ["pending", "accepted", "rejected"]
    }
}, { timestamps: true });

module.exports = mongoose.model("TAApplication", taApplicationSchema, "taapplications");
