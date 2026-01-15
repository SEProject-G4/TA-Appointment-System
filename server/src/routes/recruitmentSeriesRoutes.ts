const express = require("express");
const recruitmentController = require("../controllers/recruitmentController");
const { protectedMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", protectedMiddleware, authorize(["admin"]), recruitmentController.createRecruitmentRound);
router.get("/", protectedMiddleware, authorize(["admin"]), recruitmentController.getAllRecruitmentRounds);
router.post("/modules/batch", protectedMiddleware, authorize(["admin"]), recruitmentController.getModulesForRounds);
router.post("/:seriesId/add-module", protectedMiddleware, authorize(["admin"]), recruitmentController.addModuleToRecruitmentRound);
router.get("/:seriesId/modules", protectedMiddleware, authorize(["admin"]), recruitmentController.getModuleDetailsBySeriesId);
router.get("/:seriesId/eligible-undergraduates", protectedMiddleware, authorize(["admin"]), recruitmentController.getEligibleUndergraduates);
router.get("/:seriesId/eligible-postgraduates", protectedMiddleware, authorize(["admin"]), recruitmentController.getEligiblePostgraduates);
router.post("/copy/:seriesId", protectedMiddleware, authorize(["admin"]), recruitmentController.copyRecruitmentRound);
router.put("/:seriesId", protectedMiddleware, authorize(["admin"]), recruitmentController.updateRecruitmentRound);
router.put("/:seriesId/deadlines", protectedMiddleware, authorize(["admin"]), recruitmentController.updateRecruitmentRoundDeadlines);
router.put("/:seriesId/hour-limits", protectedMiddleware, authorize(["admin"]), recruitmentController.updateRecruitmentRoundHourLimits);
router.put("/:seriesId/close", protectedMiddleware, authorize(["admin"]), recruitmentController.closeRecruitmentRound);
router.put("/:seriesId/archive", protectedMiddleware, authorize(["admin"]), recruitmentController.archiveRecruitmentRound);
router.post("/:seriesId/notify-modules", protectedMiddleware, authorize(["admin"]), recruitmentController.notifyModules);
router.post("/:seriesId/advertise-modules", protectedMiddleware, authorize(["admin"]), recruitmentController.advertiseModules);
router.delete("/:seriesId", protectedMiddleware, authorize(["admin"]), recruitmentController.deleteRecruitmentRoundById);

module.exports = router;
