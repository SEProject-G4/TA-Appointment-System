const mongoose = require('mongoose')

// Schema to capture TA Document Submission details
// Includes core identity/banking fields and document upload metadata
const normalizeFileInput = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
        return { submitted: true, fileUrl: value };
    }
    if (typeof value === 'object') {
        return value;
    }
    return null;
};

const fileMetaSchema = new mongoose.Schema({
    submitted: { type: Boolean, default: false },
    fileUrl: { type: String },
    fileName: { type: String },
    uploadedAt: { type: Date }
}, { _id: false })

const TaDocumentSubmissionSchema = new mongoose.Schema ({
    // Link to the user who is submitting the documents (store googleId or user id as string)
    userId: {
        type: String,
        required: true
    },

    // Basic details as in the form (optional for now)
    nameAsInBankAccount: { type: String },
    address: { type: String },
    nicNumber: { type: String },
    bank: { type: String },
    branch: { type: String },
    accountNumber: { type: String },
    status: { type: String, enum: ['pending', 'submitted'], default: 'pending' },

    // Documents
    documents: {
        bankPassbookCopy: { type: fileMetaSchema, default: null, set: normalizeFileInput },
        nicCopy: { type: fileMetaSchema, default: null, set: normalizeFileInput },
        cv: { type: fileMetaSchema, default: null, set: normalizeFileInput },
        degreeCertificate: { type: fileMetaSchema, default: null, set: normalizeFileInput }
    }
}, { timestamps: true })

module.exports = mongoose.model ('TaDocumentSubmission', TaDocumentSubmissionSchema);