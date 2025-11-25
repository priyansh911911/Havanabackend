const mongoose = require('mongoose');

const restaurantOrderSchema = new mongoose.Schema({
  staffName: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  tableNo: {
    type: String,
    required: true
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    itemName: {
      type: String,
      required: false
    },
    quantity: {
      type: Number,
      required: false,
      min: 1
    },
    price: {
      type: Number,
      required: false,
      min: 0
    }
  }],
  notes: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  isMembership: {
    type: Boolean,
    default: false
  },
  isLoyalty: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'partial'],
    default: 'unpaid'
  },
  kotGenerated: {
    type: Boolean,
    default: false
  },
  kotNumber: {
    type: String
  },
  kotGeneratedAt: {
    type: Date
  },
  billGenerated: {
    type: Boolean,
    default: false
  },
  billNumber: {
    type: String
  },
  billGeneratedAt: {
    type: Date
  },
  deliveryTime: {
    type: Date
  },
  // Room service specific fields
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  grcNo: {
    type: String
  },
  roomNumber: {
    type: String
  },
  guestName: {
    type: String
  },
  guestPhone: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
restaurantOrderSchema.index({ tableNo: 1 });
restaurantOrderSchema.index({ grcNo: 1 });
restaurantOrderSchema.index({ status: 1 });
restaurantOrderSchema.index({ paymentStatus: 1 });
restaurantOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RestaurantOrder', restaurantOrderSchema);