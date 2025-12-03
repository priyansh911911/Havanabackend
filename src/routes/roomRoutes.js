const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Add room (Admin, GM)
router.post('/add', auth, authorize(['ADMIN', 'GM']), upload.array('images', 5), roomController.createRoom);

// Get all rooms (All roles)
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), roomController.getRooms);

// Get available rooms (Front Desk, Staff)
router.get('/available', auth, authorize(['FRONT DESK', 'STAFF', 'ADMIN', 'GM']), roomController.getAvailableRooms);

// Get room by ID (All roles)
router.get('/get/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), roomController.getRoomById);

// Update room (Admin, GM)
router.put('/update/:id', auth, authorize(['ADMIN', 'GM']), upload.array('images', 5), roomController.updateRoom);

// Delete room (Admin only)
router.delete('/delete/:id', auth, authorize(['ADMIN']), roomController.deleteRoom);

// Get rooms by category (All roles)
router.get('/category/:categoryId', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), roomController.getRoomsByCategory);

// Update room status (Front Desk, Staff, Admin, GM)
router.put('/status/:id', auth, authorize(['FRONT DESK', 'STAFF', 'ADMIN', 'GM']), roomController.updateRoomStatus);

module.exports = router;
