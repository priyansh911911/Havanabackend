const mongoose = require('mongoose');

const roomInventoryChecklistSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  checkedBy: { type: String, required: true },
  items: [{
    inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    itemName: { type: String, required: true },
    isPresent: { type: Boolean, default: true },
    notes: { type: String }
  }],
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('RoomInventoryChecklist', roomInventoryChecklistSchema);