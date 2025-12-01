const mongoose = require('mongoose');

const roomServiceSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  serviceType: {
    type: String,
    enum: ['Restaurant', 'Laundry', 'Housekeeping', 'Maintenance', 'Other'],
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  guestName: {
    type: String,
    required: true
  },
  grcNo: {
    type: String
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
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
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      default: 'Other'
    },
    specialInstructions: {
      type: String,
      default: ''
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  serviceCharge: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'delivered', 'cancelled'],
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomServiceSchema.index({ bookingId: 1, roomNumber: 1 });
roomServiceSchema.index({ bookingId: 1 });
roomServiceSchema.index({ grcNo: 1 });
roomServiceSchema.index({ status: 1 });
roomServiceSchema.index({ paymentStatus: 1 });
roomServiceSchema.index({ serviceType: 1 });
roomServiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RoomService', roomServiceSchema);