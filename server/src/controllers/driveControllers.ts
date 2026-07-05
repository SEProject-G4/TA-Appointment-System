import yazl from "yazl";
import type { Request, Response } from "express";
// Updated import to use getFileStream instead of getFileBuffer
const { getFileStream, createOrGetFolderForTA, uploadFileToDrive } = require("../services/driveService");
const Document = require("../models/documentModel");
const AppliedModules = require("../models/AppliedModules");
import { encrypt } from "../utils/encryption";

interface MulterFile {
  originalname: string;
  mimetype: string;
  path: string; // provided by diskStorage
}
interface MulterFiles {
  [fieldname: string]: MulterFile[]; // Ensure this matches your new diskStorage file type
}

/**
 * Handle document submission by TA
 */
export const submitDocuments = async (req: Request & { files?: any }, res: Response): Promise<Response | void> => {
  try {
    const {
      userId,
      recSeriesId,
      bankAccountName,
      bank,
      branch,
      address,
      nicNumber,
      accountNumber,
      studentType,
      position,
    } = req.body;

    if (!userId || !bankAccountName || !bank || !branch || !nicNumber || !accountNumber) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const safeUserId = String(userId);
    const safeRecSeriesId = String(recSeriesId);

    // Check if documents have already been submitted for this recruitment round
    let existingDocumentId = null;
    if (recSeriesId) {
      const existingAppliedModule = await AppliedModules.findOne({
        userId: safeUserId,
        recSeriesId: safeRecSeriesId,
      });

      if (!existingAppliedModule) {
        console.log(`No existing applied module found for user: ${safeUserId} and recruitment series: ${safeRecSeriesId}`);
      }

      if (existingAppliedModule?.isDocSubmitted && existingAppliedModule?.Documents) {
        existingDocumentId = existingAppliedModule.Documents;
      }
    }

    console.log("Creating/getting folder for TA:", safeUserId);
    const folderId = await createOrGetFolderForTA(safeUserId);
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

    // OPTIMIZED: Run all uploads in parallel to prevent Nginx 504 timeouts
    const uploadPromises = Object.keys(files || {}).map(async (key) => {
      if (!files[key] || files[key].length === 0) return null;
      
      const file = files[key][0];
      if (!file) return null;

      try {
        console.log(`Uploading ${key}...`);
        const uploaded = await uploadFileToDrive(file, folderId);
        console.log(`Uploaded ${key}`);
        
        return {
          key,
          success: true,
          data: {
            id: uploaded.id,
            name: uploaded.name,
            viewLink: uploaded.webViewLink,
            downloadLink: uploaded.webContentLink,
          }
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Failed to upload ${key}:`, errorMessage);
        return { key, success: false, error: errorMessage };
      }
    });

    // Wait for all uploads to finish simultaneously
    const results = await Promise.all(uploadPromises);

    // Sort the results into successes and failures
    results.forEach(result => {
      if (!result) return;
      if (result.success) {
        driveFiles[result.key] = result.data;
      } else {
        uploadErrors.push({ field: result.key, error: result.error as string });
      }
    });

    // Merge new files with existing files
    const finalDriveFiles = { ...existingDriveFiles, ...driveFiles };

    let newDoc;
    if (existingDocumentId) {
      const encryptedUpdates = {
        bankAccountName: bankAccountName ? encrypt(bankAccountName) : bankAccountName,
        bank: bank ? encrypt(bank) : bank,
        branch: branch ? encrypt(branch) : branch,
        address: address ? encrypt(address) : address,
        nicNumber: nicNumber ? encrypt(nicNumber) : nicNumber,
        accountNumber: accountNumber ? encrypt(accountNumber) : accountNumber,
      };

      newDoc = await Document.findByIdAndUpdate(
        existingDocumentId,
        {
          ...encryptedUpdates,
          studentType,
          driveFolderId: folderId,
          driveFiles: finalDriveFiles,
          position,
        },
        { new: true }
      );
    } else {
      newDoc = await Document.create({
        userId,
        bankAccountName,
        bank,
        branch,
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

    if (recSeriesId) {
      await AppliedModules.updateOne(
        { userId, recSeriesId },
        { $set: { isDocSubmitted: true, Documents: newDoc._id } }
      );
    } else {
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

    // 4. Fetch the streams and add them to the zip asynchronously
    for (const file of filesToZip) {
      try {
        // Fetch the raw Readable stream from Google Drive
        const stream = await getFileStream(file.id);
        
        // Pipe the stream directly into the yazl compressor
        zipfile.addReadStream(stream, `${file.label}_${file.name}`);
        
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