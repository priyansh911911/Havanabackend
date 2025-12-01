const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

// Add new user (Admin only)
router.post('/add', auth, authorize('ADMIN'), userController.addUser);

// Get all users (Admin and GM)
router.get('/all', auth, authorize(['ADMIN', 'GM']), userController.getAllUsers);

// Update user (Admin only)
router.put('/update/:userId', auth, authorize('ADMIN'), userController.updateUser);

// Delete user (Admin only)
router.delete('/delete/:userId', auth, authorize('ADMIN'), userController.deleteUser);

// Toggle user status (Admin only)
router.patch('/toggle-status/:userId', auth, authorize('ADMIN'), userController.toggleUserStatus);

module.exports = router;