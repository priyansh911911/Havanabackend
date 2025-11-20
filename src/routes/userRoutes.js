const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus
} = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, authorize('admin'), getAllUsers);

// Get user by ID (admin only)
router.get('/:id', auth, authorize('admin'), getUserById);

// Update user (admin only)
router.put('/:id', auth, authorize('admin'), updateUser);

// Delete user (admin only)
router.delete('/:id', auth, authorize('admin'), deleteUser);

// Toggle user status (admin only)
router.patch('/:id/toggle-status', auth, authorize('admin'), toggleUserStatus);

module.exports = router;