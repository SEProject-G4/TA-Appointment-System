const mongoose = require("mongoose");

const TaApplicationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
        },
    moduleID: {
        type: String,
        required: true  
    },
    status: {
        type: String,
        enum: ['Pending', 'accepted', 'rejected'],
        default: "Pending",
        required: true
    }
    }, { timestamps: true })

module.exports = mongoose.model('TaApplication', TaApplicationSchema);