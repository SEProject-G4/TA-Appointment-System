const express= require('express');
const router = express.Router();
const { protected: protectedMiddleware, authorize } = require('../middleware/authMiddleware');
const { getAllRequests, applyForTA,getAppliedModules, getAcceptedModules } = require('../controllers/taControllers');


const User = require('../models/User');

// router.get('/requests',protected, authorize(['undergraduate', 'postgraduate']), getAllRequests);
// router.post('/apply', protected, authorize(['undergraduate', 'postgraduate']), applyForTA);
// router.get('/applied-modules', protected, authorize(['undergraduate', 'postgraduate']), getAppliedModules);
// router.get('/accepted-modules', protected, authorize(['undergraduate', 'postgraduate']), getAcceptedModules);

router.get('/requests', getAllRequests);
router.post('/apply',  applyForTA);
router.get('/applied-modules', getAppliedModules);
router.get('/accepted-modules',  getAcceptedModules);

module.exports = router;





