const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Generate next invoice number
router.get('/next-invoice-number', invoiceController.getNextInvoiceNumber);

// Reset invoice counter for current month (admin only)
router.post('/reset-counter', invoiceController.resetInvoiceCounter);

// Generate invoice number for booking submission
router.post('/generate-for-booking', async (req, res) => {
  try {
    const { format = 'monthly' } = req.body;
    const invoiceNumber = await invoiceController.generateInvoiceNumber(format);
    res.json({ success: true, invoiceNumber, format });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set invoice counter to specific number
router.post('/set-counter', invoiceController.setInvoiceCounter);

module.exports = router;