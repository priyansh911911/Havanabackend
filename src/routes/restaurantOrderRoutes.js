const express = require('express');
const router = express.Router();
const restaurantOrderController = require('../controllers/restaurantOrderController');
const { auth, authorize } = require('../middleware/auth');

// Create new restaurant order (All roles)
router.post('/create', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.createOrder);

// Get all restaurant orders (All roles)
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.getAllOrders);

// Update restaurant order status (All roles)
router.patch('/:id/status', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.updateOrderStatus);

// Update restaurant order (All roles)
router.patch('/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantOrderController.updateOrder);

// Link existing orders to bookings (Admin, GM)
router.post('/link-to-bookings', auth, authorize(['ADMIN', 'GM', 'FRONT DESK']), restaurantOrderController.linkOrdersToBookings);

module.exports = router;