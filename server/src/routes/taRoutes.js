const express= require('express');
const router = express.Router();

const { getAllRequests, applyForTA,getAppliedModules } = require('../controllers/taControllers');
const User = require('../models/User');

router.get('/requests', getAllRequests);
router.post('/apply', applyForTA);
router.get('/applied-modules', getAppliedModules);

module.exports = router;





