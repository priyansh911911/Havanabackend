const express = require('express');
const router = express.Router();
const laundryController = require('../controllers/laundryController');
const { auth, authorize } = require('../middleware/auth');

// Order Management
router.post('/create', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.createLaundryOrder);
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']),laundryController.getAllLaundryOrders);
router.get('/available-items', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']),laundryController.getAvailableItems);
router.get('/booking/:bookingId', auth,authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLaundryByBooking);
router.get('/inhouse', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']),laundryController.getInhouseOrders);
router.get('/vendor-orders', auth,authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getVendorOrders);
router.get('/vendor/:vendorId', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']),laundryController.getLaundryByVendor);

// Status and Dashboard
router.get('/dashboard', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLaundryDashboard);
router.get('/items/overview', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getItemStatusOverview);
router.get('/items/status/:status', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getItemsByStatus);
router.get('/status/:status', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLaundryByStatus);

// Loss Reporting
router.post('/loss-report', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']),laundryController.createLossReport);
router.get('/loss-report', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']),laundryController.getAllLossReports);
router.get('/loss-report/:id', auth,authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLossReportById);
router.patch('/loss-report/:id/status', auth,authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.updateLossReportStatus);

// Dynamic routes (keep at end)
router.get('/room/:roomNumber', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLaundryByRoom);
router.get('/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']),laundryController.getLaundryOrderById);
router.put('/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']),laundryController.updateLaundryOrder);
router.patch('/:id/status', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']),laundryController.updateLaundryStatus);
router.patch('/:id/cancel', auth,authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.cancelLaundryOrder);
router.delete('/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.deleteLaundry);

// Item Management
router.patch('/item/:itemId/status', auth,authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.updateItemStatus);
router.patch('/items/bulk-status', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.bulkUpdateItemStatus);
router.post('/item/:itemId/damage', auth,authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.reportDamageOrLoss);

// Vendor Management
router.patch('/:id/vendor-details', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']),laundryController.updateVendorDetails);

module.exports = router;