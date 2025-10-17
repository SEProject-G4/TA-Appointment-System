// src/routes/driveRoutes.js
const express = require("express");
const multer = require("multer");
const { submitDocuments } = require("../controllers/driveControllers");

const router = express.Router();

// Configure multer
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Define route
router.post(
  "/submit",
  upload.fields([
    { name: "bankPassbook", maxCount: 1 },
    { name: "nicCopy", maxCount: 1 },
    { name: "cv", maxCount: 1 },
    { name: "degreeCertificate", maxCount: 1 },
    { name: "declarationForm", maxCount: 1 },
  ]),
  submitDocuments // handled by controller
);

module.exports = router;
