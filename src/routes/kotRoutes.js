const express = require('express');
const router = express.Router();
const kotController = require('../controllers/kotController');

// Create new KOT
router.post('/create', kotController.createKOT);

// Get all KOTs
router.get('/all', kotController.getAllKOTs);

// Update KOT status
router.patch('/:id/status', kotController.updateKOTStatus);

// Update KOT item statuses
router.patch('/:id/item-statuses', kotController.updateItemStatuses);

module.exports = router;