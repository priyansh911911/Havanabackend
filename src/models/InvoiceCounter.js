const mongoose = require('mongoose');

const invoiceCounterSchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    unique: true // Format: "YYYY-MM"
  },
  counter: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InvoiceCounter', invoiceCounterSchema);