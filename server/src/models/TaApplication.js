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
        enum: ['pending', 'accepted', 'rejected'],
        default: "pending",
        required: true
    }
    })

module.exports = mongoose.model('TaApplication', TaApplicationSchema);