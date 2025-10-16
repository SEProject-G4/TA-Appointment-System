// src/models/documentModel.js
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bankAccountName: String,
    address: String,
    nicNumber: String,
    accountNumber: String,
    studentType: String,
    position: Object,
    driveFolderId: String,
    driveFiles: Object, // { fieldName: { id, name, viewLink, downloadLink } }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
