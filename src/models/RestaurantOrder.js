const mongoose = require('mongoose');

const restaurantOrderSchema = new mongoose.Schema({
  staffName: {
    type: String,
    required: false,
  },
  customerName: {
    type: String,
    required: false
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  tableNo: {
    type: String,
    required: false
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
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  gstRate: {
    type: Number,
    default: 5,
    min: 0,
    max: 100
  },
  sgstRate: {
    type: Number,
    default: 2.5,
    min: 0,
    max: 50
  },
  cgstRate: {
    type: Number,
    default: 2.5,
    min: 0,
    max: 50
  },
  sgstAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  cgstAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalGstAmount: {
    type: Number,
    default: 0,
    min: 0
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
  nonChargeable: {
    type: Boolean,
    default: false
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

// Pre-save middleware to calculate GST amounts
restaurantOrderSchema.pre('save', function(next) {
  if (this.isModified('subtotal') || this.isModified('sgstRate') || this.isModified('cgstRate')) {
    this.sgstAmount = (this.subtotal * this.sgstRate) / 100;
    this.cgstAmount = (this.subtotal * this.cgstRate) / 100;
    this.totalGstAmount = this.sgstAmount + this.cgstAmount;
    this.amount = this.subtotal + this.totalGstAmount - this.discount;
  }
  next();
});

// Index for efficient queries
restaurantOrderSchema.index({ tableNo: 1 });
restaurantOrderSchema.index({ grcNo: 1 });
restaurantOrderSchema.index({ status: 1 });
restaurantOrderSchema.index({ paymentStatus: 1 });
restaurantOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RestaurantOrder', restaurantOrderSchema);