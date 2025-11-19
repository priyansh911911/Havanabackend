const express = require('express');
const router = express.Router();
const roomInventoryChecklistController = require('../controllers/roomInventoryChecklistController');

// Get all checklists
router.get('/', roomInventoryChecklistController.getAllChecklists);

// Get checklist by ID
router.get('/:id', roomInventoryChecklistController.getChecklistById);

// Create new checklist
router.post('/', roomInventoryChecklistController.createChecklist);

// Update checklist
router.put('/:id', roomInventoryChecklistController.updateChecklist);

// Delete checklist
router.delete('/:id', roomInventoryChecklistController.deleteChecklist);

// Get checklists by room
router.get('/room/:roomId', roomInventoryChecklistController.getChecklistsByRoom);

module.exports = router;