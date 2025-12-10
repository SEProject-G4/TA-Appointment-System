const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/google-verify", authController.googleVerify);
router.post("/select-role", authController.selectRole);
router.post("/switch-role", authController.switchRole);
router.get("/current-user", authController.getCurrentUser);
router.get("/profile", authController.getUserProfile);
router.post("/logout", authController.logout);

module.exports = router;
