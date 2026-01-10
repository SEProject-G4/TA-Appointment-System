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
      recSeriesId,
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

    // Check if documents have already been submitted for this recruitment round
    // If they exist, we'll update them (editing mode)
    let existingDocumentId = null;
    if (recSeriesId) {
      const existingAppliedModule = await AppliedModules.findOne({
        userId,
        recSeriesId,
      });

      // If documents exist, get the document ID for updating
      if (existingAppliedModule?.isDocSubmitted && existingAppliedModule?.Documents) {
        existingDocumentId = existingAppliedModule.Documents;
      }
    }

    console.log("Creating/getting folder for TA:", userId);
    const folderId = await createOrGetFolderForTA(userId);
    console.log("Folder ID:", folderId);

    const driveFiles: Record<string, any> = {};
    const uploadErrors: { field: string; error: string }[] = [];

    // If editing, get existing document's driveFiles to preserve files that aren't being updated
    let existingDriveFiles: Record<string, any> = {};
    if (existingDocumentId) {
      const existingDoc = await Document.findById(existingDocumentId);
      if (existingDoc?.driveFiles) {
        existingDriveFiles = existingDoc.driveFiles as Record<string, any>;
      }
    }

    const files = req.files as MulterFiles;

    // Upload new files if provided
    for (const key in files) {
      try {
        if (!files[key] || files[key].length === 0) {
          continue; // Skip if no file provided (user might not want to update this file)
        }
        const file = files[key][0];

        if (!file) {
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

    // Merge new files with existing files (new files override existing ones)
    const finalDriveFiles = { ...existingDriveFiles, ...driveFiles };

    // Update existing document if editing, otherwise create new
    let newDoc;
    if (existingDocumentId) {
      // Update existing document
      newDoc = await Document.findByIdAndUpdate(
        existingDocumentId,
        {
          bankAccountName,
          address,
          nicNumber,
          accountNumber,
          studentType,
          driveFolderId: folderId,
          driveFiles: finalDriveFiles, // Use merged files (existing + new)
          position,
        },
        { new: true }
      );
    } else {
      // Create new document (only if we have at least some files or it's a new submission)
      if (Object.keys(driveFiles).length === 0 && Object.keys(existingDriveFiles).length === 0) {
        return res.status(400).json({
          message: "At least one file must be uploaded for new document submission",
        });
      }
      newDoc = await Document.create({
        userId,
        bankAccountName,
        address,
        nicNumber,
        accountNumber,
        studentType,
        driveFolderId: folderId,
        driveFiles: finalDriveFiles,
        position,
      });
    }

    if (uploadErrors.length > 0) {
      return res.status(207).json({
        message: "Documents uploaded with some failures",
        document: newDoc,
        failedUploads: uploadErrors,
      });
    }
    // Update the isDocSubmitted flag in AppliedModules for the specific recruitment round
    if (recSeriesId) {
      await AppliedModules.updateOne(
        { userId, recSeriesId },
        { $set: { isDocSubmitted: true, Documents: newDoc._id } }
      );
    } else {
      // Fallback for backward compatibility (update all AppliedModules for this user)
      await AppliedModules.updateOne(
        { userId },
        { $set: { isDocSubmitted: true, Documents: newDoc._id } }
      );
    }

    return res.status(201).json({
      message: existingDocumentId 
        ? "Documents updated successfully" 
        : "Documents uploaded successfully",
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
