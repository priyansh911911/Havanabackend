const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { auth, authorize } = require('../middleware/auth');

// Get all inventory items (All roles)
router.get('/items', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), inventoryController.getAllItems);

// Create new inventory item (Admin, GM)
router.post('/items', auth, authorize(['ADMIN', 'GM','FRONT DESK']), inventoryController.createItem);

// Update inventory item (Admin, GM, Staff)
router.put('/items/:id', auth, authorize(['ADMIN', 'GM', 'STAFF','FRONT DESK']), inventoryController.updateItem);

// Delete inventory item (Admin only)
router.delete('/items/:id', auth, authorize('ADMIN'), inventoryController.deleteItem);

// Get items by category (All roles)
router.get('/category/:category', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), inventoryController.getByCategory);

// Stock in operation (Staff, Admin, GM)
router.post('/items/:id/stock-in', auth, authorize(['STAFF', 'ADMIN', 'GM','FRONT DESK']), inventoryController.stockIn);

// Stock out operation (Staff, Admin, GM)
router.post('/items/:id/stock-out', auth, authorize(['STAFF', 'ADMIN', 'GM','FRONT DESK']), inventoryController.stockOut);

// Update stock (Staff, Admin, GM)
router.put('/items/:id/stock', auth, authorize(['STAFF', 'ADMIN', 'GM','FRONT DESK']), inventoryController.updateStock);

// Get stock movements (Admin, GM, Accounts)
router.get('/movements', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS','FRONT DESK']), inventoryController.getStockMovements);

// Get low stock items (All roles)
router.get('/low-stock', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), inventoryController.getLowStockItems);

// Search items (All roles)
router.get('/search', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), inventoryController.searchItems);

module.exports = router;