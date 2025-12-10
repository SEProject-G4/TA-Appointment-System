const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const taController = require("../controllers/taControllers");

const router = express.Router();

// router.get('/requests',protected, authorize(['undergraduate', 'postgraduate']), getAllRequests);
// router.post('/apply', protected, authorize(['undergraduate', 'postgraduate']), applyForTA);
// router.get('/applied-modules', protected, authorize(['undergraduate', 'postgraduate']), getAppliedModules);
// router.get('/accepted-modules', protected, authorize(['undergraduate', 'postgraduate']), getAcceptedModules);

router.get("/requests", authMiddleware.protected, authMiddleware.authorize(['undergraduate', 'postgraduate']), taController.getAllRequests);
router.post("/apply", authMiddleware.protected, authMiddleware.authorize(['undergraduate', 'postgraduate']), taController.applyForTA);
router.get("/applied-modules", authMiddleware.protected, authMiddleware.authorize(['undergraduate', 'postgraduate']), taController.getAppliedModules);
router.get("/accepted-modules", authMiddleware.protected, authMiddleware.authorize(['undergraduate', 'postgraduate']), taController.getAcceptedModules);

module.exports = router;
