import mongoose = require("mongoose");
import { Schema, Document, Model } from "mongoose";

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

const documentModel: Model<IDocument> = mongoose.model<IDocument>("Document", documentSchema);

module.exports = documentModel;
