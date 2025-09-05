const mongoose = require("mongoose");

const TaApplicationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    // Store in DB as moduleId (ObjectId). Expose alias "moduleID" for backward compatibility
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'ModuleDetails',
        alias: 'moduleID'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
        required: true
    }
    }, { timestamps: true })

module.exports = mongoose.model('TaApplication', TaApplicationSchema);