const mongoose = require('mongoose')

// Schema to capture TA Document Submission details
// Includes core identity/banking fields and document upload metadata
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

    // Documents
    documents: {
        bankPassbookCopy: { type: fileMetaSchema, default: null },
        nicCopy: { type: fileMetaSchema, default: null },
        cv: { type: fileMetaSchema, default: null },
        degreeCertificate: { type: fileMetaSchema, default: null }
    }
}, { timestamps: true })

module.exports = mongoose.model ('TaDocumentSubmission', TaDocumentSubmissionSchema);