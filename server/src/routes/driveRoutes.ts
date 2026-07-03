const express = require("express");
const multer = require("multer");
const { submitDocuments, downloadAllDocumentsAsZip } = require("../controllers/driveControllers");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const storage = multer.memoryStorage();

// Configure multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Define route
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
