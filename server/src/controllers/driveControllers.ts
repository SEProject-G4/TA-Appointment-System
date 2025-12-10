import type { Response } from "express";
import type { Request } from "express";
const { createOrGetFolderForTA, uploadFileToDrive } = require("../services/driveService");
const Document = require("../models/documentModel");
const AppliedModules = require("../models/AppliedModules");

interface MulterFiles {
  [fieldname: string]: File[];
}
/**
 * Handle document submission by TA
 */
export const submitDocuments = async (req: Request & { files?: any }, res: Response): Promise<Response> => {
  try {
    const {
      userId,
      bankAccountName,
      address,
      nicNumber,
      accountNumber,
      studentType,
      position,
    } = req.body;

    if (!userId || !bankAccountName || !nicNumber || !accountNumber) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log("Creating/getting folder for TA:", userId);
    const folderId = await createOrGetFolderForTA(userId);
    console.log("Folder ID:", folderId);

    const driveFiles: Record<string, any> = {};
    const uploadErrors: { field: string; error: string }[] = [];

    const files = req.files as MulterFiles;

    for (const key in files) {
      try {
        if (!files[key] || files[key].length === 0) {
          uploadErrors.push({ field: key, error: "No file provided" });
          continue;
        }
        const file = files[key][0];

        if (!file) {
          uploadErrors.push({ field: key, error: "No file provided" });
          continue;
        }
        console.log(`Uploading ${key}...`);
        const uploaded = await uploadFileToDrive(file, folderId);
        driveFiles[key] = {
          id: uploaded.id,
          name: uploaded.name,
          viewLink: uploaded.webViewLink,
          downloadLink: uploaded.webContentLink,
        };
        console.log(`Uploaded ${key}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Failed to upload ${key}:`, errorMessage);
        uploadErrors.push({ field: key, error: errorMessage });
      }
    }

    const newDoc = await Document.create({
      userId,
      bankAccountName,
      address,
      nicNumber,
      accountNumber,
      studentType,
      driveFolderId: folderId,
      driveFiles,
      position,
    });

    if (uploadErrors.length > 0) {
      return res.status(207).json({
        message: "Documents uploaded with some failures",
        document: newDoc,
        failedUploads: uploadErrors,
      });
    }
    // Update the isDocSubmitted flag in AppliedModules
    await AppliedModules.updateOne(
      { userId },
      { $set: { isDocSubmitted: true, Documents: newDoc._id } }
    );

    return res.status(201).json({
      message: "Documents uploaded successfully",
      document: newDoc,
    });
  } catch (err) {
    console.error("Error uploading documents:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({
      message: "Upload failed",
      error: errorMessage,
      details: (err as any).response?.data || err?.toString(),
    });
  }
};

module.exports = { submitDocuments };
