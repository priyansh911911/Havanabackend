const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { auth, authorize } = require('../middleware/auth');

// Generate next invoice number (Front Desk, Staff, Admin)
router.get('/next-invoice-number', auth, authorize(['ADMIN', 'FRONT DESK', 'STAFF']), invoiceController.getNextInvoiceNumber);

// Reset invoice counter for current month (admin only)
router.post('/reset-counter', auth, authorize('ADMIN'), invoiceController.resetInvoiceCounter);

// Generate invoice number for booking submission (Front Desk, Staff, Admin)
router.post('/generate-for-booking', auth, authorize(['ADMIN', 'FRONT DESK', 'STAFF']), async (req, res) => {
  try {
    const { format = 'monthly' } = req.body;
    const invoiceNumber = await invoiceController.generateInvoiceNumber(format, true);
    res.json({ success: true, invoiceNumber, format });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set invoice counter to specific number (Admin only)
router.post('/set-counter', auth, authorize('ADMIN'), invoiceController.setInvoiceCounter);

module.exports = router;