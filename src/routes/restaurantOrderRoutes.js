const express = require('express');
const router = express.Router();
const restaurantOrderController = require('../controllers/restaurantOrderController');

// Create new order
router.post('/create', restaurantOrderController.createOrder);

// Get all orders
router.get('/all', restaurantOrderController.getAllOrders);

module.exports = router;