const mongoose = require("mongoose");

const moduleDetailsSchema = new mongoose.Schema({
    recruitmentSeriesId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "RecruitmentSeries"
    },
    moduleCode: { 
        type: String, 
        required: true, 
        trim: true 
    },
    moduleName: {
      type: String,
      required: true,
      trim: true,
    },
    semester: { 
        type: Number, 
        required: true, 
        trim: true 
    },
    coordinators: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true, 
        default: []
    }],
    applicationDueDate: { 
        type: Date, 
        required: true 
    },
    documentDueDate: {
      type: Date,
      required: true,
    },
    requiredTAHours: { 
        type: Number, 
        required: false, 
        default: 0, 
        min: 0 
    },
    openForUndergraduates: {
        type: Boolean,
        required: true,
        default: false,
    },
    openForPostgraduates: {
        type: Boolean,
        required: true,
        default: false,
    },
    undergraduateCounts: {
        type: {
            required: { type: Number, default: 0, min: 0 },
            remaining: { type: Number, default: 0, min: 0 },
            applied: { type: Number, default: 0, min: 0 },
            reviewed: { type: Number, default: 0, min: 0 },
            accepted: { type: Number, default: 0, min: 0 },
            docSubmitted: { type: Number, default: 0, min: 0 },
            appointed: { type: Number, default: 0, min: 0 }
        },
        default: function() {
            return {
                required: 0,
                remaining: 0,
                applied: 0,
                reviewed: 0,
                accepted: 0,
                docSubmitted: 0,
                appointed: 0
            };
        }
    },
    postgraduateCounts: {
        type: {
            required: { type: Number, default: 0, min: 0 },
            remaining: { type: Number, default: 0, min: 0 },
            applied: { type: Number, default: 0, min: 0 },
            reviewed: { type: Number, default: 0, min: 0 },
            accepted: { type: Number, default: 0, min: 0 },
            docSubmitted: { type: Number, default: 0, min: 0 },
            appointed: { type: Number, default: 0, min: 0 }
        },
        default: function() {
            return {
                required: 0,
                remaining: 0,
                applied: 0,
                reviewed: 0,
                accepted: 0,
                docSubmitted: 0,
                appointed: 0
            };
        }
    },
    requirements: {
        type: String,
        required: false,
        default: "",
    },
    moduleStatus: {
        type: String,
        required: true,
        default: "initialised",
        enum: ["initialised", "pending changes", "changes submitted","advertised", "full", "getting documents", "closed"]
    }
}, { timestamps: true });


// Pre-validate hook to check all coordinators are lecturers
moduleDetailsSchema.pre('validate', async function(next) {
    if (Array.isArray(this.coordinators) && this.coordinators.length > 0) {
        const User = mongoose.model('User');
        const users = await User.find({ _id: { $in: this.coordinators }, role: 'lecturer' }).select('_id');
        if (users.length !== this.coordinators.length) {
            const error = new mongoose.Error.ValidationError(this);
            error.addError('coordinators', new mongoose.Error.ValidatorError({
                message: 'All coordinators must be users with the lecturer role.',
                path: 'coordinators',
                value: this.coordinators
            }));
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('ModuleDetails', moduleDetailsSchema, 'moduledetails');
