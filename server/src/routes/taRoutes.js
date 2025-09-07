const express= require('express');
const router = express.Router();

const { getAllRequests, applyForTA,getAppliedModules, getAcceptedModules } = require('../controllers/taControllers');
const User = require('../models/User');

router.get('/requests', getAllRequests);
router.post('/apply', applyForTA);
router.get('/applied-modules', getAppliedModules);
router.get('/accepted-modules', getAcceptedModules);

module.exports = router;





