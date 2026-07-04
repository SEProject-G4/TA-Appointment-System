import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs";
import path from "path";


export interface MulterFile {
  originalname: string;
  mimetype: string;
  path: string; // provided by diskStorage
}

export interface UploadedFile {
  id?: string;
  name?: string;
  webViewLink?: string;
  webContentLink?: string;
}

// Configure for Shared Drive or regular folder
const USE_SHARED_DRIVE = process.env.USE_SHARED_DRIVE === "true";
const SHARED_DRIVE_ID = process.env.SHARED_DRIVE_ID;
const PARENT_FOLDER_ID = process.env.PARENT_FOLDER_ID || null; // For regular Drive

const auth = new google.auth.GoogleAuth({
  keyFilename: "./src/config/service-account-key.json",
  scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

/**
 * Create or get a TA folder in Google Drive or Shared Drive
 */
async function createOrGetFolderForTA(taId: string): Promise<string> {
  const folderName = `TA_${taId}`;

  if (USE_SHARED_DRIVE) {
    if (!SHARED_DRIVE_ID) {
      throw new Error("SHARED_DRIVE_ID must be set when using Shared Drive");
    }

    // Search in Shared Drive
    const list = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      corpora: "drive",
      driveId: SHARED_DRIVE_ID,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    if (list && list.data && list.data.files && list.data.files.length > 0 && list.data.files[0] && list.data.files[0].id) {
      console.log(`Found existing folder: ${folderName}`);
      return list.data.files[0].id;
    }

    // Create new folder in Shared Drive
    const res = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [SHARED_DRIVE_ID],
      },
      fields: "id, name",
      supportsAllDrives: true,
    });

    console.log(`Created folder in Shared Drive: ${folderName} with ID: ${res.data.id}`);
    return res.data.id!;
  } else {
    // Regular Drive with parent folder
    if (!PARENT_FOLDER_ID) {
      throw new Error("PARENT_FOLDER_ID must be set when not using Shared Drive");
    }

    const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${PARENT_FOLDER_ID}' in parents`;

    const list = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      spaces: "drive",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (list && list.data && list.data.files && list.data.files.length > 0 && list.data.files[0] && list.data.files[0].id) {
      console.log(`Found existing folder: ${folderName}`);
      return list.data.files[0].id!;
    }

    // Create new folder
    const res = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [PARENT_FOLDER_ID],
      },
      fields: "id, name",
      supportsAllDrives: true,
    });

    console.log(`Created folder: ${folderName} with ID: ${res.data.id}`);
    return res.data.id!;
  }
}

/**
 * Upload a file into a specified folder in Google Drive safely via disk streams
 */
async function uploadFileToDrive(file: MulterFile, folderId: string): Promise<UploadedFile> {
  try {
    const fileMeta = {
      name: file.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      // Stream directly from the VM's hard drive
      body: fs.createReadStream(file.path),
    };

    const uploadOptions = {
      requestBody: fileMeta,
      media,
      fields: "id, name, webViewLink, webContentLink",
      supportsAllDrives: true,
    };

    const uploaded = await drive.files.create(uploadOptions);

    // Make the file viewable by anyone with the link
    const permissionOptions = {
      fileId: uploaded.data.id!,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    };

    await drive.permissions.create(permissionOptions);

    return {
      ...(uploaded.data.id && { id: uploaded.data.id }),
      ...(uploaded.data.name && { name: uploaded.data.name }),
      ...(uploaded.data.webViewLink && { webViewLink: uploaded.data.webViewLink }),
      ...(uploaded.data.webContentLink && { webContentLink: uploaded.data.webContentLink }),
    };
    
  } finally {
    // CRITICAL: Guarantees the temporary file is wiped from your VM's disk.
    if (file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, (err) => {
        if (err) {
          console.error(`Failed to delete temporary file at ${file.path}:`, err);
        }
      });
    }
  }
}

/**
 * Delete a folder and all its contents from Google Drive
 */
async function deleteFolderAndContents(folderId: string): Promise<void> {
  try {
    const listOptions = {
      q: `'${folderId}' in parents and trashed=false`,
      fields: "files(id, name, mimeType)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    };

    const list = await drive.files.list(listOptions);

    if (list.data.files && list.data.files.length > 0) {
      const deletePromises = list.data.files.map(async (file: any) => {
        try {
          if (file.mimeType === "application/vnd.google-apps.folder") {
            await deleteFolderAndContents(file.id);
          } else {
            await drive.files.delete({
              fileId: file.id,
              supportsAllDrives: true,
            });
            console.log(`Deleted file: ${file.name} (${file.id})`);
          }
        } catch (error) {
          console.error(`Failed to delete file ${file.name} (${file.id}):`, error);
        }
      });

      await Promise.all(deletePromises);
    }

    await drive.files.delete({
      fileId: folderId,
      supportsAllDrives: true,
    });
    console.log(`Deleted folder: ${folderId}`);
  } catch (error) {
    console.error(`Failed to delete folder ${folderId}:`, error);
    throw error;
  }
}

/**
 * Fetches a file from Google Drive as a Buffer 
 * (Kept for backwards compatibility)
 */
async function getFileBuffer(fileId: string): Promise<Buffer> {
  try {
    const res = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" }
    );
    return Buffer.from(res.data as ArrayBuffer);
  } catch (error) {
    console.error(`Failed to get buffer for file ${fileId}`, error);
    throw error;
  }
}

/**
 * OPTIMIZED: Fetches a file from Google Drive as a Readable Stream.
 * Use this with yazl.addReadStream() to bypass RAM entirely.
 */
async function getFileStream(fileId: string): Promise<Readable> {
  try {
    const res = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "stream" }
    );
    return res.data as Readable;
  } catch (error) {
    console.error(`Failed to get stream for file ${fileId}`, error);
    throw error;
  }
}

// Export using CommonJS for compatibility with your existing requires
module.exports = { 
  createOrGetFolderForTA, 
  uploadFileToDrive, 
  deleteFolderAndContents, 
  getFileBuffer,
  getFileStream 
};