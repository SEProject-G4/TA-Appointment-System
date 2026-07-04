import yazl from "yazl";
import type { Request, Response } from "express";
const { getFileBuffer } = require("../services/driveService");
const { createOrGetFolderForTA, uploadFileToDrive } = require("../services/driveService");
const Document = require("../models/documentModel");
const AppliedModules = require("../models/AppliedModules");
import { encrypt } from "../utils/encryption";

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

    const isPostgraduate = studentType === "postgraduate";

    const requiredFileFields = [
      "bankPassbook",
      "nicCopy",
      "cv",
      "declarationForm",
    ];

    if (isPostgraduate) {
      requiredFileFields.push("degreeCertificate");
    }

    if (!existingDocumentId) {
      const missingFileFields = requiredFileFields.filter(
        (field) => !files?.[field] || files[field].length === 0,
      );

      if (missingFileFields.length > 0) {
        return res.status(400).json({
          message: "All documents are required for the first submission",
          missingFileFields,
        });
      }
    }

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
      const encryptedUpdates = {
        bankAccountName: bankAccountName ? encrypt(bankAccountName) : bankAccountName,
        address: address ? encrypt(address) : address,
        nicNumber: nicNumber ? encrypt(nicNumber) : nicNumber,
        accountNumber: accountNumber ? encrypt(accountNumber) : accountNumber,
      };

      // Update existing document
      newDoc = await Document.findByIdAndUpdate(
        existingDocumentId,
        {
          ...encryptedUpdates,
          studentType,
          driveFolderId: folderId,
          driveFiles: finalDriveFiles, // Use merged files (existing + new)
          position,
        },
        { new: true }
      );
    } else {
      // Create new document (only if we have at least some files or it's a new submission)
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

export const downloadAllDocumentsAsZip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId, taName } = req.body;

    if (!documentId) {
       res.status(400).json({ message: "Document ID is required" });
       return;
    }

    const docRecord = await Document.findById(documentId).lean();
    
    if (!docRecord || !docRecord.driveFiles) {
       res.status(404).json({ message: "Document record not found." });
       return;
    }

    const docs = docRecord.driveFiles as any;
    const filesToZip: { id: string, name: string, label: string }[] = [];

    if (docs.bankPassbook?.id) filesToZip.push({ id: docs.bankPassbook.id, name: docs.bankPassbook.name || 'passbook.pdf', label: 'Bank_Passbook' });
    if (docs.nicCopy?.id) filesToZip.push({ id: docs.nicCopy.id, name: docs.nicCopy.name || 'nic.pdf', label: 'NIC' });
    if (docs.cv?.id) filesToZip.push({ id: docs.cv.id, name: docs.cv.name || 'cv.pdf', label: 'CV' });
    if (docs.degreeCertificate?.id) filesToZip.push({ id: docs.degreeCertificate.id, name: docs.degreeCertificate.name || 'degree.pdf', label: 'Degree' });
    if (docs.declarationForm?.id) filesToZip.push({ id: docs.declarationForm.id, name: docs.declarationForm.name || 'declaration.pdf', label: 'Declaration' });

    if (filesToZip.length === 0) {
       res.status(400).json({ message: "No uploaded files found in this record." });
       return;
    }

    const safeName = (taName || "TA").replace(/\s+/g, "_");

    // 1. Set the headers immediately
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}_Documents.zip"`);

    // 2. Initialize the yazl ZipFile
    const zipfile = new yazl.ZipFile();

    // 3. Pipe the yazl output stream directly to the Express response
    zipfile.outputStream.pipe(res);

    // 4. Fetch the buffers and add them to the zip asynchronously
    for (const file of filesToZip) {
      try {
        const buffer = await getFileBuffer(file.id);
        
        // yazl handles the buffer compression asynchronously in the background
        zipfile.addBuffer(buffer, `${file.label}_${file.name}`);
        
      } catch (err) {
        console.error(`Skipping file ${file.name} due to fetch error.`);
      }
    }

    // 5. Tell yazl we are done adding files. 
    // It will finalize the compression and automatically close the Express response stream.
    zipfile.end();

  } catch (err) {
    console.error("ZIP creation failed:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to create ZIP file" });
    }
  }
};

module.exports = { submitDocuments, downloadAllDocumentsAsZip };
