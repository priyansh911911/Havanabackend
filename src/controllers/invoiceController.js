const InvoiceCounter = require('../models/InvoiceCounter');
const Invoice = require('../models/Invoice');

// Generate invoice number with different formats (only increments counter when actually used)
exports.generateInvoiceNumber = async (format = 'monthly', incrementCounter = true, retryCount = 0) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  let counter, invoiceNumber;
  
  try {
    switch (format) {
      case 'monthly': // HH/MM/0001 (resets each month)
        const monthKey = `${year}-${month}`;
        counter = await InvoiceCounter.findOne({ month: monthKey });
        if (!counter) {
          counter = new InvoiceCounter({ month: monthKey, counter: 0 });
        }
        const nextCount = counter.counter + 1;
        if (incrementCounter) {
          counter.counter = nextCount;
          await counter.save();
        }
        invoiceNumber = `HH/${month}/${String(nextCount).padStart(4, '0')}`;
        break;
      
      case 'yearly': // HH/2025/0001 (resets each year)
        const yearKey = `${year}`;
        counter = await InvoiceCounter.findOne({ month: yearKey });
        if (!counter) {
          counter = new InvoiceCounter({ month: yearKey, counter: 0 });
        }
        const nextYearCount = counter.counter + 1;
        if (incrementCounter) {
          counter.counter = nextYearCount;
          await counter.save();
        }
        invoiceNumber = `HH/${year}/${String(nextYearCount).padStart(4, '0')}`;
        break;
        
      case 'continuous': // HH-000001 (never resets)
        const globalKey = 'global';
        counter = await InvoiceCounter.findOne({ month: globalKey });
        if (!counter) {
          counter = new InvoiceCounter({ month: globalKey, counter: 0 });
        }
        const nextGlobalCount = counter.counter + 1;
        if (incrementCounter) {
          counter.counter = nextGlobalCount;
          await counter.save();
        }
        invoiceNumber = `HH-${String(nextGlobalCount).padStart(6, '0')}`;
        break;
        
      case 'simple': // INV-0001 (simple format)
        const simpleKey = 'simple';
        counter = await InvoiceCounter.findOne({ month: simpleKey });
        if (!counter) {
          counter = new InvoiceCounter({ month: simpleKey, counter: 0 });
        }
        const nextSimpleCount = counter.counter + 1;
        if (incrementCounter) {
          counter.counter = nextSimpleCount;
          await counter.save();
        }
        invoiceNumber = `INV-${String(nextSimpleCount).padStart(4, '0')}`;
        break;
        
      default:
        // Default to monthly format
        return await exports.generateInvoiceNumber('monthly', incrementCounter, retryCount);
    }
    
    return invoiceNumber;
  } catch (error) {
    // Handle duplicate key errors and retry
    if ((error.code === 11000 || error.message.includes('duplicate')) && retryCount < 3) {
      console.log(`Invoice generation conflict, retrying... (attempt ${retryCount + 1})`);
      // Wait a small random time before retry
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      return await exports.generateInvoiceNumber(format, incrementCounter, retryCount + 1);
    }
    throw error;
  }
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
      const previewNumber = await exports.generateInvoiceNumber(format, false);
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