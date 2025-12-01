const mongoose = require('mongoose');

const checkoutSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  
  // Service charges breakdown
  restaurantCharges: { type: Number, default: 0 },
  laundryCharges: { type: Number, default: 0 },
  inspectionCharges: { type: Number, default: 0 },
  roomServiceCharges: { type: Number, default: 0 },
  bookingCharges: { type: Number, default: 0 },
  
  // Service items details
  serviceItems: {
    restaurant: [{
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantOrder' },
      items: [{
        itemName: String,
        quantity: Number,
        rate: Number,
        amount: Number
      }],
      orderAmount: Number,
      orderDate: Date
    }],
    
    laundry: [{
      laundryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laundry' },
      items: [{
        itemName: String,
        quantity: Number,
        rate: Number,
        amount: Number
      }],
      serviceAmount: Number,
      serviceDate: Date
    }],
    
    inspection: [{
      inspectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomInspection' },
      charges: Number,
      inspectionDate: Date,
      remarks: String,
      items: [{
        description: String,
        amount: Number,
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }
      }]
    }]
  },
  
  totalAmount: { type: Number, required: true },
  pendingAmount: { type: Number, default: 0 },
  
  // Invoice details
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceGenerated: {
    type: Boolean,
    default: false
  },
  invoiceGeneratedAt: {
    type: Date
  },
  
  status: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending'
  }
}, { timestamps: true });

// Calculate total amount before saving
checkoutSchema.pre('save', function(next) {
  this.totalAmount = (this.restaurantCharges || 0) + (this.laundryCharges || 0) + 
                    (this.inspectionCharges || 0) + (this.roomServiceCharges || 0) + (this.bookingCharges || 0);
  next();
});

module.exports = mongoose.model('Checkout', checkoutSchema);