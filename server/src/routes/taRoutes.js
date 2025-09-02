const express= require('express');
const router = express.Router();

const {getAllModules, getAllRequests } = require('../controllers/taControllers');

router.get('/requests', getAllRequests);

module.exports = router;





