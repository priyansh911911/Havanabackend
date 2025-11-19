const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.post('/add', roomController.createRoom);
router.get('/all', roomController.getRooms);
router.get('/available', roomController.getAvailableRooms);
router.get('/get/:id', roomController.getRoomById);
router.put('/update/:id', roomController.updateRoom);
router.delete('/delete/:id', roomController.deleteRoom);
router.get('/category/:categoryId', roomController.getRoomsByCategory);
router.put('/status/:id', roomController.updateRoomStatus);

// Get all available rooms
router.get('/available', roomController.getAvailableRooms);

module.exports = router;
