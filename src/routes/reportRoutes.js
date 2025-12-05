const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

// Night Audit Report
router.get('/night-audit', auth, reportController.getNightAuditReport);

module.exports = router;