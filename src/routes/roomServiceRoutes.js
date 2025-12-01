const express = require('express');
const router = express.Router();
const roomServiceController = require('../controllers/roomServiceController');
const { auth, authorize } = require('../middleware/auth');

// Create room service order (Front Desk, Staff)
router.post('/create', auth, authorize(['FRONT DESK', 'STAFF']), roomServiceController.createOrder);

// Get all orders (All roles)
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), roomServiceController.getAllOrders);

// Get order by ID (All roles)
router.get('/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), roomServiceController.getOrderById);

// Update order status (Staff, Front Desk)
router.patch('/:id/status', auth, authorize(['STAFF', 'FRONT DESK']), roomServiceController.updateOrderStatus);

// Update payment status (Accounts, Admin)
router.patch('/:id/payment', auth, authorize(['ACCOUNTS', 'ADMIN']), roomServiceController.updatePaymentStatus);

// Generate KOT (Staff, Front Desk)
router.post('/:id/kot', auth, authorize(['STAFF', 'FRONT DESK']), roomServiceController.generateKOT);

// Generate Bill (Accounts, Admin, Front Desk)
router.post('/:id/bill', auth, authorize(['ACCOUNTS', 'ADMIN', 'FRONT DESK']), roomServiceController.generateBill);

// Bill lookup (Accounts, Admin, Front Desk)
router.get('/lookup/bills', auth, authorize(['ACCOUNTS', 'ADMIN', 'FRONT DESK']), roomServiceController.billLookup);

// Get room service charges for checkout (Front Desk, Accounts)
router.get('/charges/checkout', auth, authorize(['FRONT DESK', 'ACCOUNTS']), roomServiceController.getRoomServiceCharges);

// Mark orders as paid (Accounts, Admin)
router.post('/mark-paid', auth, authorize(['ACCOUNTS', 'ADMIN']), roomServiceController.markOrdersPaid);

// Delete order (Admin only)
router.delete('/:id', auth, authorize('ADMIN'), roomServiceController.deleteOrder);

module.exports = router;