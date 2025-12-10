const express = require("express");
const applicationController = require("../controllers/applicationController");
const { protectedMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.delete("/:applicationId", protectedMiddleware, authorize(["admin"]), applicationController.deleteApplication);

module.exports = router;
