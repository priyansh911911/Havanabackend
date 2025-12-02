const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth, authorize } = require('../middleware/auth');

// Dashboard stats (Admin, GM, Accounts)
router.get('/stats', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'FRONT DESK']), dashboardController.getDashboardStats);

module.exports = router;