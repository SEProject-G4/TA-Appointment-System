// src/services/driveService.js
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const SERVICE_ACCOUNT_FILE = path.join(__dirname, "../../service-account-key.json");

// Configure for Shared Drive or regular folder
const USE_SHARED_DRIVE = process.env.USE_SHARED_DRIVE === 'true';
const SHARED_DRIVE_ID = process.env.SHARED_DRIVE_ID;
const PARENT_FOLDER_ID = process.env.PARENT_FOLDER_ID || null; // For regular Drive

const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

/**
 * Create or get a TA folder in Google Drive or Shared Drive
 */
async function createOrGetFolderForTA(taId) {
  const folderName = `TA_${taId}`;

  if (USE_SHARED_DRIVE) {
    // Search in Shared Drive
    const list = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      corpora: "drive",
      driveId: SHARED_DRIVE_ID,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    if (list.data.files.length) {
      console.log(`Found existing folder: ${folderName}`);
      return list.data.files[0].id;
    }

    // Create new folder in Shared Drive
    const res = await drive.files.create({
      resource: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [SHARED_DRIVE_ID],
      },
      fields: "id, name",
      supportsAllDrives: true,
    });

    console.log(`Created folder in Shared Drive: ${folderName} with ID: ${res.data.id}`);
    return res.data.id;
  } else {
    // Regular Drive with parent folder
    if (!PARENT_FOLDER_ID) {
      throw new Error("PARENT_FOLDER_ID must be set when not using Shared Drive");
    }

    let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${PARENT_FOLDER_ID}' in parents`;

    const list = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      spaces: "drive",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (list.data.files.length) {
      console.log(`Found existing folder: ${folderName}`);
      return list.data.files[0].id;
    }

    // Create new folder
    const res = await drive.files.create({
      resource: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [PARENT_FOLDER_ID],
      },
      fields: "id, name",
      supportsAllDrives: true,
    });

    console.log(`Created folder: ${folderName} with ID: ${res.data.id}`);
    return res.data.id;
  }
}

/**
 * Upload a file into a specified folder in Google Drive
 */
async function uploadFileToDrive(file, folderId) {
  const fileMeta = {
    name: file.originalname,
    parents: [folderId],
  };

  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path),
  };

  const uploadOptions = {
    resource: fileMeta,
    media,
    fields: "id, name, webViewLink, webContentLink",
    supportsAllDrives: true,
  };

  const uploaded = await drive.files.create(uploadOptions);

  // Make the file viewable by anyone with the link
  const permissionOptions = {
    fileId: uploaded.data.id,
    requestBody: { role: "reader", type: "anyone" },
    supportsAllDrives: true,
  };

  await drive.permissions.create(permissionOptions);

  // Delete local temp file
  try {
    fs.unlinkSync(file.path);
    console.log(`Deleted temp file: ${file.path}`);
  } catch (err) {
    console.error(`Failed to delete temp file: ${file.path}`, err);
  }

  return uploaded.data;
}

module.exports = { createOrGetFolderForTA, uploadFileToDrive };
