const express = require('express');
const router = express.Router();
const restaurantCategoryController = require('../controllers/restaurantCategoryController');

// Get all categories
router.get('/all', restaurantCategoryController.getAllCategories);

// Add new category
router.post('/add', restaurantCategoryController.addCategory);

// Update category
router.put('/update/:id', restaurantCategoryController.updateCategory);

// Delete category
router.delete('/delete/:id', restaurantCategoryController.deleteCategory);

module.exports = router;