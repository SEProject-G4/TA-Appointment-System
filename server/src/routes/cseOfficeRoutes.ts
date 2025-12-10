const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const cseOfficeController = require("../controllers/cseOfficeController");

const router = express.Router();

router.get("/view-ta-documents", authMiddleware.protected, authMiddleware.authorize(["cse-office", "cse office", "admin"]), cseOfficeController.viewTADocuments);

module.exports = router;
