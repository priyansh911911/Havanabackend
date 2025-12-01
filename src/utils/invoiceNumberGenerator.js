const InvoiceCounter = require('../models/InvoiceCounter');

const generateInvoiceNumber = async () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthKey = `${now.getFullYear()}-${month}`;
  
  // Find or create counter for current month
  let counter = await InvoiceCounter.findOne({ month: monthKey });
  
  if (!counter) {
    counter = new InvoiceCounter({ month: monthKey, counter: 1 });
  } else {
    counter.counter += 1;
  }
  
  await counter.save();
  
  // Format: HH/MM/0001
  const invoiceNumber = `HH/${month}/${String(counter.counter).padStart(4, '0')}`;
  
  return invoiceNumber;
};

module.exports = { generateInvoiceNumber };