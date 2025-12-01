const express = require('express');
const router = express.Router();
const kotController = require('../controllers/kotController');
const { auth, authorize } = require('../middleware/auth');

// Create new KOT (Staff, Front Desk)
router.post('/create', auth, authorize(['STAFF', 'FRONT DESK']), kotController.createKOT);

// Get all KOTs (All roles)
router.get('/all', auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), kotController.getAllKOTs);

// Update KOT status (Staff, Front Desk)
router.patch('/:id/status', auth, authorize(['STAFF', 'FRONT DESK']), kotController.updateKOTStatus);

// Update KOT item statuses (Staff, Front Desk)
router.patch('/:id/item-statuses', auth, authorize(['STAFF', 'FRONT DESK']), kotController.updateItemStatuses);

module.exports = router;