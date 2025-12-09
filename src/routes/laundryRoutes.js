const express = require('express');
const router = express.Router();
const laundryController = require('../controllers/laundryController');
const { auth, authorize } = require('../middleware/auth');

// Order Management
router.post('/orders', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryController.createLaundryOrder);
router.get('/orders', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getAllLaundryOrders);
router.get('/orders/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLaundryOrderById);
router.put('/orders/:id', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryController.updateLaundryOrder);
router.put('/orders/:id/status', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryController.updateLaundryStatus);
router.put('/orders/:id/cancel', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryController.cancelLaundryOrder);
router.delete('/orders/:id', auth, authorize('ADMIN'), laundryController.deleteLaundry);

// Damage/Loss Reporting
router.put('/orders/:id/items/:itemId/damage', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryController.reportDamageOrLoss);
router.post('/loss-reports', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryController.createLossReport);
router.get('/loss-reports', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getAllLossReports);
router.get('/loss-reports/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLossReportById);
router.put('/loss-reports/:id/status', auth, authorize(['ADMIN', 'GM', 'STAFF', 'FRONT DESK']), laundryController.updateLossReportStatus);

// Filter Routes
router.get('/room/:roomNumber', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLaundryByRoom);
router.get('/status/:status', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLaundryByStatus);
router.get('/vendor/:vendorId', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLaundryByVendor);
router.get('/booking/:bookingId', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), laundryController.getLaundryByBooking);

module.exports = router;
