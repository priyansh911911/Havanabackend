const express = require('express');
const router = express.Router();
const restaurantCategoryController = require('../controllers/restaurantCategoryController');
const { auth, authorize } = require('../middleware/auth');

// Get all restaurant categories (All roles)
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), restaurantCategoryController.getAllCategories);

// Add new restaurant category (Admin, GM, Front Desk)
router.post('/add', auth, authorize(['ADMIN', 'GM', 'FRONT DESK']), restaurantCategoryController.addCategory);

// Update restaurant category (Admin, GM, Front Desk)
router.put('/update/:id', auth, authorize(['ADMIN', 'GM', 'FRONT DESK']), restaurantCategoryController.updateCategory);

// Delete restaurant category (Admin only)
router.delete('/delete/:id', auth, authorize('ADMIN'), restaurantCategoryController.deleteCategory);

module.exports = router;