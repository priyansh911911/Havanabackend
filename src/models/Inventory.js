const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'damaged', 'missing'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);