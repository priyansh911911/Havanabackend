const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Create a new room (admin only)
router.post('/add', authMiddleware(['admin']), roomController.createRoom);
// Get all rooms
router.get('/all', roomController.getRooms);
//get available rooms by date range
router.get('/available', roomController.getAvailableRooms);

// Get a room by ID
router.get('/get/:id', roomController.getRoomById);
// Update a room (admin or housekeeping staff)
router.put('/update/:id', authMiddleware(['admin', 'staff'], ['housekeeping']), roomController.updateRoom);
// Delete a room (admin only)
router.delete('/delete/:id', authMiddleware(['admin']), roomController.deleteRoom);
// Get rooms by category with booking status
router.get('/category/:categoryId', roomController.getRoomsByCategory);
// Update room status directly
router.put('/status/:id', authMiddleware(['admin', 'staff'], ['reception', 'housekeeping']), roomController.updateRoomStatus);

// Get all available rooms
router.get('/available', roomController.getAvailableRooms);

module.exports = router;
