const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { auth, authorize } = require('../middleware/auth');

// Check invoice status (Front Desk, Staff, Admin)
router.get('/next-invoice-number', auth, authorize(['ADMIN', 'FRONT DESK', 'STAFF']), invoiceController.getNextInvoiceNumber);

module.exports = router;