const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { auth, authorize } = require('../middleware/auth');

// Create checkout (Front Desk, Accounts)
router.post('/create', auth, authorize(['FRONT DESK', 'ACCOUNTS']), checkoutController.createCheckout);

// Get checkout by booking ID (Front Desk, Accounts, Admin)
router.get('/booking/:bookingId', auth, authorize(['FRONT DESK', 'ACCOUNTS', 'ADMIN']), checkoutController.getCheckout);

// Update payment status (Accounts, Admin)
router.put('/:id/payment', auth, authorize(['ACCOUNTS', 'ADMIN']), checkoutController.updatePaymentStatus);

// Generate invoice (Accounts, Admin, Front Desk)
router.post('/:id/generate-invoice', auth, authorize(['ACCOUNTS', 'ADMIN', 'FRONT DESK']), checkoutController.generateInvoice);

// Get invoice by checkout ID (Accounts, Admin, Front Desk)
router.get('/:id/invoice', auth, authorize(['ACCOUNTS', 'ADMIN', 'FRONT DESK']), checkoutController.getInvoice);

// Get tax configuration (Accounts, Admin)
router.get('/tax-config', auth, authorize(['ACCOUNTS', 'ADMIN']), checkoutController.getTaxConfig);

// Update tax configuration (Admin only)
router.put('/tax-config', auth, authorize('ADMIN'), checkoutController.updateTaxConfig);

module.exports = router;
