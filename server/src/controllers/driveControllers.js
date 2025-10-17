// src/controllers/driveController.js
const { createOrGetFolderForTA, uploadFileToDrive } = require("../services/driveService");
const Document = require("../models/documentModel");
const AppliedModules = require("../models/AppliedModules");

/**
 * Handle document submission by TA
 */
exports.submitDocuments = async (req, res) => {
  try {
    const { userId, bankAccountName, address, nicNumber, accountNumber, studentType, position } = req.body;

    if (!userId || !bankAccountName || !nicNumber || !accountNumber) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    console.log("Creating/getting folder for TA:", userId);
    const folderId = await createOrGetFolderForTA(userId);
    console.log("Folder ID:", folderId);

    const driveFiles = {};
    const uploadErrors = [];

    for (const key in req.files) {
      try {
        const file = req.files[key][0];
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
        console.error(`Failed to upload ${key}:`, err.message);
        uploadErrors.push({ field: key, error: err.message });
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

    // Update the isDocSubmitted flag in AppliedModules
    await AppliedModules.updateOne(
      { userId },
      { $set: { isDocSubmitted: true, Documents: newDoc._id } }
    );

    if (uploadErrors.length > 0) {
      return res.status(207).json({
        message: "Documents uploaded with some failures",
        document: newDoc,
        failedUploads: uploadErrors,
      });
    }

    res.status(201).json({
      message: "Documents uploaded successfully",
      document: newDoc,
    });
  } catch (err) {
    console.error("Error uploading documents:", err);
    res.status(500).json({
      message: "Upload failed",
      error: err.message,
      details: err.response?.data || err.toString(),
    });
  }
};
