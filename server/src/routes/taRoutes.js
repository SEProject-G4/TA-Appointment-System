const express= require('express');
const router = express.Router();

const { getAllRequests, applyForTA } = require('../controllers/taControllers');

router.get('/requests', getAllRequests);
router.post('/apply', applyForTA);

module.exports = router;





