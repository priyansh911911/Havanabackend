const InvoiceCounter = require('../models/InvoiceCounter');
const Invoice = require('../models/Invoice');

// Generate invoice number with different formats
exports.generateInvoiceNumber = async (format = 'monthly') => {
  const now = new Date();
  // TEST: Uncomment next line to test January 2025 (month 01)
  // now.setMonth(0); // 0 = January
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  let counter, invoiceNumber;
  
  switch (format) {
    case 'monthly': // HH/MM/0001 (resets each month)
      const monthKey = `${year}-${month}`;
      counter = await InvoiceCounter.findOne({ month: monthKey });
      if (!counter) {
        counter = new InvoiceCounter({ month: monthKey, counter: 0 });
      }
      counter.counter += 1;
      await counter.save();
      invoiceNumber = `HH/${month}/${String(counter.counter).padStart(4, '0')}`;
      break;
      
    case 'yearly': // HH/2025/0001 (resets each year)
      const yearKey = `${year}`;
      counter = await InvoiceCounter.findOne({ month: yearKey });
      if (!counter) {
        counter = new InvoiceCounter({ month: yearKey, counter: 0 });
      }
      counter.counter += 1;
      await counter.save();
      invoiceNumber = `HH/${year}/${String(counter.counter).padStart(4, '0')}`;
      break;
      
    case 'continuous': // HH-000001 (never resets)
      const globalKey = 'global';
      counter = await InvoiceCounter.findOne({ month: globalKey });
      if (!counter) {
        counter = new InvoiceCounter({ month: globalKey, counter: 0 });
      }
      counter.counter += 1;
      await counter.save();
      invoiceNumber = `HH-${String(counter.counter).padStart(6, '0')}`;
      break;
      
    case 'simple': // INV-0001 (simple format)
      const simpleKey = 'simple';
      counter = await InvoiceCounter.findOne({ month: simpleKey });
      if (!counter) {
        counter = new InvoiceCounter({ month: simpleKey, counter: 0 });
      }
      counter.counter += 1;
      await counter.save();
      invoiceNumber = `INV-${String(counter.counter).padStart(4, '0')}`;
      break;
      
    default:
      // Default to monthly format
      return await exports.generateInvoiceNumber('monthly');
  }
  
  return invoiceNumber;
};

// Preview next invoice number without incrementing counter
exports.getNextInvoiceNumber = async (req, res) => {
  try {
    const { bookingId, format = 'monthly', preview = 'true' } = req.query;
    
    // Check if this booking already has an invoice number
    if (bookingId) {
      const existingInvoice = await Invoice.findOne({ bookingId });
      if (existingInvoice) {
        return res.json({ success: true, invoiceNumber: existingInvoice.invoiceNumber });
      }
    }
    
    // If preview mode, show what the next number would be without incrementing
    if (preview === 'true') {
      const now = new Date();
      // TEST: Uncomment next line to test January 2025 (month 01)
      // now.setMonth(0); // 0 = January
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      let counter, previewNumber;
      
      switch (format) {
        case 'monthly':
          const monthKey = `${year}-${month}`;
          counter = await InvoiceCounter.findOne({ month: monthKey });
          const nextCount = (counter?.counter || 0) + 1;
          previewNumber = `HH/${month}/${String(nextCount).padStart(4, '0')}`;
          break;
        case 'yearly':
          const yearKey = `${year}`;
          counter = await InvoiceCounter.findOne({ month: yearKey });
          const nextYearCount = (counter?.counter || 0) + 1;
          previewNumber = `HH/${year}/${String(nextYearCount).padStart(4, '0')}`;
          break;
        case 'continuous':
          const globalKey = 'global';
          counter = await InvoiceCounter.findOne({ month: globalKey });
          const nextGlobalCount = (counter?.counter || 0) + 1;
          previewNumber = `HH-${String(nextGlobalCount).padStart(6, '0')}`;
          break;
        case 'simple':
          const simpleKey = 'simple';
          counter = await InvoiceCounter.findOne({ month: simpleKey });
          const nextSimpleCount = (counter?.counter || 0) + 1;
          previewNumber = `INV-${String(nextSimpleCount).padStart(4, '0')}`;
          break;
        default:
          const monthKey2 = `${year}-${month}`;
          counter = await InvoiceCounter.findOne({ month: monthKey2 });
          const nextCount2 = (counter?.counter || 0) + 1;
          previewNumber = `HH/${month}/${String(nextCount2).padStart(4, '0')}`;
      }
      
      return res.json({ success: true, invoiceNumber: previewNumber, format, preview: true });
    }
    
    // Generate actual invoice number (increments counter)
    const invoiceNumber = await exports.generateInvoiceNumber(format);
    
    // Save invoice record if bookingId provided
    if (bookingId) {
      await Invoice.create({ bookingId, invoiceNumber, format, createdAt: new Date() });
    }
    
    res.json({ success: true, invoiceNumber, format });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reset invoice counter for current month
exports.resetInvoiceCounter = async (req, res) => {
  try {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthKey = `${now.getFullYear()}-${month}`;
    
    await InvoiceCounter.deleteOne({ month: monthKey });
    res.json({ success: true, message: `Counter reset for ${monthKey}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Set invoice counter to specific starting number
exports.setInvoiceCounter = async (req, res) => {
  try {
    const { startFrom } = req.body;
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthKey = `${now.getFullYear()}-${month}`;
    
    await InvoiceCounter.findOneAndUpdate(
      { month: monthKey },
      { counter: startFrom - 1 },
      { upsert: true }
    );
    
    res.json({ success: true, message: `Counter set to start from ${startFrom} for ${monthKey}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};