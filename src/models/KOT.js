const mongoose = require('mongoose');

const kotSchema = new mongoose.Schema({
  kotNumber: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }, 
  orderType: {
    type: String,
    enum: ['restaurant', 'room-service'],
    default: 'restaurant'
  },
  tableNo: {
    type: String,
    required: true
  },
  items: [{
    itemName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    specialInstructions: {
      type: String,
      default: ''
    }
  }],
  itemStatuses: [{
    itemIndex: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'served', 'delivered'],
      default: 'pending'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  notes: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
kotSchema.index({ kotNumber: 1 });
kotSchema.index({ orderId: 1 });
kotSchema.index({ status: 1 });
kotSchema.index({ createdAt: -1 });

module.exports = mongoose.model('KOT', kotSchema);