const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/laundryCategoryController');
const { auth, authorize } = require('../middleware/auth');

// Category Management
router.post('/', auth, authorize(['ADMIN', 'GM','STAFF', 'FRONT DESK']), categoryController.createCategory);
router.get('/', auth, authorize(['ADMIN', 'GM','STAFF', 'FRONT DESK']), categoryController.getAllCategories);
router.get('/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), categoryController.getCategoryById);
router.put('/:id', auth, authorize(['ADMIN', 'GM','STAFF', 'FRONT DESK']), categoryController.updateCategory);
router.delete('/:id', auth, authorize(['ADMIN']), categoryController.deleteCategory);

module.exports = router;