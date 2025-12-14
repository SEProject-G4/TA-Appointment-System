import mongoose = require("mongoose");
import { Schema, Document, Model } from "mongoose";
import { encrypt, decrypt } from "../utils/encryption";

interface IDriveFiles {
  [fieldName: string]: {
    id: string;
    name: string;
    viewLink: string;
    downloadLink: string;
  };
}

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  bankAccountName?: string;
  address?: string;
  nicNumber?: string;
  accountNumber?: string;
  studentType?: string;
  position?: Record<string, any>;
  driveFolderId?: string;
  driveFiles?: IDriveFiles;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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

// Encrypt sensitive fields before saving
documentSchema.pre("save", function (next) {
  try {
    if (this.bankAccountName && !this.bankAccountName.includes(":")) {
      this.bankAccountName = encrypt(this.bankAccountName);
    }
    if (this.address && !this.address.includes(":")) {
      this.address = encrypt(this.address);
    }
    if (this.nicNumber && !this.nicNumber.includes(":")) {
      this.nicNumber = encrypt(this.nicNumber);
    }
    if (this.accountNumber && !this.accountNumber.includes(":")) {
      this.accountNumber = encrypt(this.accountNumber);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Decrypt sensitive fields after retrieval
const decryptFields = function (doc: any) {
  if (doc) {
    if (doc.bankAccountName) doc.bankAccountName = decrypt(doc.bankAccountName);
    if (doc.address) doc.address = decrypt(doc.address);
    if (doc.nicNumber) doc.nicNumber = decrypt(doc.nicNumber);
    if (doc.accountNumber) doc.accountNumber = decrypt(doc.accountNumber);
  }
};

documentSchema.post("find", function (docs: any[]) {
  docs.forEach(decryptFields);
});

documentSchema.post("findOne", function (doc: any) {
  decryptFields(doc);
});

documentSchema.post("findOneAndUpdate", function (doc: any) {
  decryptFields(doc);
});

documentSchema.post("save", function (doc: any) {
  decryptFields(doc);
});

const documentModel: Model<IDocument> = mongoose.model<IDocument>("Document", documentSchema);

module.exports = documentModel;
