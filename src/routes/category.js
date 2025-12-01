const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth, authorize } = require('../middleware/auth');

// Create a new room category (Admin, GM)
router.post('/add', auth, authorize(['ADMIN', 'GM']), categoryController.createCategory);

// Get all room categories (All roles)
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), categoryController.getCategories);

// Get a room category by ID (All roles)
router.get('/get/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), categoryController.getCategoryById);

// Update a room category (Admin, GM)
router.put('/update/:id', auth, authorize(['ADMIN', 'GM']), categoryController.updateCategory);

// Delete a room category (Admin only)
router.delete('/delete/:id', auth, authorize('ADMIN'), categoryController.deleteCategory);

module.exports = router; 
