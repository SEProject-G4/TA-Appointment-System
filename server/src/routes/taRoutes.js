const express= require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getAllRequests, applyForTA,getAppliedModules, getAcceptedModules } = require('../controllers/taControllers');


const User = require('../models/User');

router.get('/requests',authMiddleware.protected, authMiddleware.authorize(['undergraduate', 'postgraduate']), getAllRequests);
router.post('/apply', authMiddleware.protected, authMiddleware.authorize(['undergraduate', 'postgraduate']), applyForTA);
router.get('/applied-modules', authMiddleware.protected, authMiddleware.authorize(['undergraduate', 'postgraduate']), getAppliedModules);
router.get('/accepted-modules', authMiddleware.protected, authMiddleware.authorize(['undergraduate', 'postgraduate']), getAcceptedModules);

// router.get('/requests', getAllRequests);
// router.post('/apply',  applyForTA);
// router.get('/applied-modules', getAppliedModules);
// router.get('/accepted-modules',  getAcceptedModules);

module.exports = router;





