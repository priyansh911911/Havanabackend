const express = require('express');
const router = express.Router();
const roomInventoryChecklistController = require('../controllers/roomInventoryChecklistController');
const { auth, authorize } = require('../middleware/auth');

// Get all checklists (All roles)
router.get('/', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), roomInventoryChecklistController.getAllChecklists);

// Get checklist by ID (All roles)
router.get('/:id', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), roomInventoryChecklistController.getChecklistById);

// Create new checklist (Staff, Front Desk, Admin, GM)
router.post('/', auth, authorize(['STAFF', 'FRONT DESK', 'ADMIN', 'GM']), roomInventoryChecklistController.createChecklist);

// Update checklist (Staff, Front Desk, Admin, GM)
router.put('/:id', auth, authorize(['STAFF', 'FRONT DESK', 'ADMIN', 'GM']), roomInventoryChecklistController.updateChecklist);

// Delete checklist (Admin only)
router.delete('/:id', auth, authorize('ADMIN'), roomInventoryChecklistController.deleteChecklist);

// Get checklists by room (All roles)
router.get('/room/:roomId', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), roomInventoryChecklistController.getChecklistsByRoom);

module.exports = router;