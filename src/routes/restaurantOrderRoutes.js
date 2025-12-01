const express = require('express');
const router = express.Router();
const restaurantOrderController = require('../controllers/restaurantOrderController');
const { auth, authorize } = require('../middleware/auth');

// Create new restaurant order (Staff, Front Desk)
router.post('/create', auth, authorize(['STAFF', 'FRONT DESK']), restaurantOrderController.createOrder);

// Get all restaurant orders (All roles)
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.getAllOrders);

// Update restaurant order status (Staff, Front Desk)
router.patch('/:id/status', auth, authorize(['STAFF', 'FRONT DESK']), restaurantOrderController.updateOrderStatus);

// Link existing orders to bookings (Admin, GM)
router.post('/link-to-bookings', auth, authorize(['ADMIN', 'GM']), restaurantOrderController.linkOrdersToBookings);

module.exports = router;