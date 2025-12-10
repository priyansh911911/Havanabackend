const express = require('express');
const router = express.Router();
const laundryController = require('../controllers/laundryController');
const { auth, authorize } = require('../middleware/auth');

// Order Management
router.post('/create', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.createLaundryOrder);
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getAllLaundryOrders);
router.get('/available-items', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryController.getAvailableItems);
router.get('/booking/:bookingId', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLaundryByBooking);
router.get('/inhouse', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryController.getInhouseOrders);
router.get('/vendor-orders', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryController.getVendorOrders);
router.get('/vendor/:vendorId', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryController.getLaundryByVendor);
router.get('/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLaundryOrderById);
router.put('/:id', auth, authorize(['STAFF', 'FRONT DESK', 'ADMIN', 'GM']), laundryController.updateLaundryOrder);
router.patch('/:id/status', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.updateLaundryStatus);
router.patch('/:id/cancel', auth, authorize(['STAFF', 'FRONT DESK', 'ADMIN']), laundryController.cancelLaundryOrder);

// Loss Reporting
router.post('/loss-report', auth, authorize(['STAFF', 'FRONT DESK', 'ADMIN']), laundryController.createLossReport);
router.get('/loss-reports', auth, authorize(['ADMIN', 'GM', 'FRONT DESK', 'ACCOUNTS']), laundryController.getAllLossReports);
router.get('/loss-report/:id', auth, authorize(['ADMIN', 'GM', 'FRONT DESK', 'ACCOUNTS']), laundryController.getLossReportById);
router.patch('/loss-report/:id/status', auth, authorize(['ADMIN', 'FRONT DESK', 'GM']), laundryController.updateLossReportStatus);

// Item Management
router.patch('/item/:itemId/status', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'FRONT DESK']), laundryController.updateItemStatus);
router.post('/item/:itemId/damage', auth, authorize(['STAFF', 'ADMIN', 'FRONT DESK']), laundryController.reportDamageOrLoss);

// Vendor Management
router.patch('/:id/vendor-details', auth, authorize(['STAFF','ADMIN', 'FRONT DESK']), laundryController.updateVendorDetails);

module.exports = router;