const Invoice = require('../models/Invoice');

// Preview next invoice number without incrementing counter
exports.getNextInvoiceNumber = async (req, res) => {
  try {
    const { bookingId } = req.query;
    
    // Check if this booking already has an invoice
    if (bookingId) {
      const existingInvoice = await Invoice.findOne({ bookingId });
      if (existingInvoice) {
        return res.json({ success: true, message: 'Invoice already exists for this booking' });
      }
    }
    
    res.json({ success: true, message: 'Invoice can be created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};