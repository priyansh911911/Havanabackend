const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  invoiceNumber: {
    type: String,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);