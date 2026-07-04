const express = require("express");
const multer = require("multer");
const os = require("os"); // Added for OS temp directory
const path = require("path"); // Added for file extensions
const { submitDocuments, downloadAllDocumentsAsZip } = require("../controllers/driveControllers");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// Switch to diskStorage to protect VM RAM
const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: (error: Error | null, destination: string) => void) {
    // Routes files to Ubuntu's /tmp directory
    cb(null, os.tmpdir());
  },
  filename: function (req: any, file: any, cb: (error: Error | null, filename: string) => void) {
    // Generate a unique filename to prevent collisions during concurrent uploads
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer with the new disk storage
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file stays exactly the same
});

// Routes remain completely unchanged
router.post(
  "/submit",
  authMiddleware.protected, authMiddleware.authorize(["undergraduate", "postgraduate"]),
  upload.fields([
    { name: "bankPassbook", maxCount: 1 },
    { name: "nicCopy", maxCount: 1 },
    { name: "cv", maxCount: 1 },
    { name: "degreeCertificate", maxCount: 1 },
    { name: "declarationForm", maxCount: 1 },
  ]),
  submitDocuments // handled by controller
);

router.post("/zip", authMiddleware.protected, authMiddleware.authorize(["cse-office", "cse office", "admin"]), downloadAllDocumentsAsZip);

module.exports = router;