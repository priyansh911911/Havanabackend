const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth, authorize } = require('../middleware/auth');

// Dashboard stats (Admin, GM, Accounts)
router.get('/stats', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'FRONT DESK']), dashboardController.getDashboardStats);

// Download dashboard stats as CSV
router.get('/download-csv', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'FRONT DESK']), dashboardController.downloadDashboardCSV);

// Individual CSV exports
router.get('/export/total-bookings', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'FRONT DESK']), dashboardController.exportTotalBookings);
router.get('/export/active-bookings', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'FRONT DESK']), dashboardController.exportActiveBookings);
router.get('/export/cancelled-bookings', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'FRONT DESK']), dashboardController.exportCancelledBookings);
router.get('/export/revenue', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'FRONT DESK']), dashboardController.exportRevenue);
router.get('/export/online-payments', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'FRONT DESK']), dashboardController.exportOnlinePayments);
router.get('/export/cash-payments', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'FRONT DESK']), dashboardController.exportCashPayments);
router.get('/export/restaurant-orders', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'FRONT DESK']), dashboardController.exportRestaurantOrders);

module.exports = router;