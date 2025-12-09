const mongoose = require("mongoose");

const laundrySchema = new mongoose.Schema({
  // 🧾 Basic Guest + Room Info
  orderType: {
    type: String,
    enum: ["hotel_laundry", "room_laundry"],
    required: true
  },
  grcNo: String,
  roomNumber: String,
  requestedByName: String, // Guest name

  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",  
  },

  // 🏢 Vendor Assignment
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LaundryVendor"
  },

  // 🧺 Laundry Items
  items: [
    {
      rateId: { type: mongoose.Schema.Types.ObjectId, ref: "LaundryItem", required: true },
      itemName: String,
      quantity: { type: Number, default: 1, min: 0 },
      deliveredQuantity: { type: Number, default: 0, min: 0 },
      status: {
        type: String,
        enum: ["pending", "picked_up", "ready", "delivered", "cancelled"],
        default: "pending",
      },
      calculatedAmount: { type: Number, default: 0 },
      damageReported: { type: Boolean, default: false },
      itemNotes: String,
    }
  ],

  // ⚡ Urgency + Special Instructions
  isUrgent: { type: Boolean, default: false },
  urgencyNote: String,
  specialInstructions: String,

  // 🧭 Laundry Process Status
  laundryStatus: {
    type: String,
    enum: ["pending", "picked_up", "ready", "delivered", "cancelled"],
    default: "pending",
  },

  pickupTime: Date,
  deliveredTime: Date,
  scheduledPickupTime: Date,
  scheduledDeliveryTime: Date,
  pickupBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receivedBy: String,

  // 🧥 Damage / Loss Tracking
  damageReported: { type: Boolean, default: false },
  damageNotes: String,
  discardReason: String,
  returnDeadline: Date,
  lossNote: String,
  isLost: { type: Boolean, default: false },
  isFound: { type: Boolean, default: false },
  foundDate: Date,
  foundRemarks: String,
  lostDate: Date,

  // 💰 Billing
  isBillable: { type: Boolean, default: true }, 
  totalAmount: { type: Number, default: 0 },
  isComplimentary: { type: Boolean, default: false },
  billStatus: {
    type: String,
    enum: ["unpaid", "paid", "waived"],
    default: "unpaid",
  },

  isReturned: { type: Boolean, default: false },
  isCancelled: { type: Boolean, default: false },

  // 📞 Vendor Communication
  vendorOrderId: String, // vendor's internal order ID
  vendorNotes: String,
  vendorPickupTime: Date,
  vendorDeliveryTime: Date

}, { timestamps: true });


// Auto-calc total + auto-fill item name from LaundryItem
laundrySchema.pre("save", async function (next) {
  if (this.items?.length) {
    let total = 0;
    for (let item of this.items) {
      if (item.rateId) {
        try {
          const rateDoc = await mongoose.model("LaundryItem").findById(item.rateId);
          if (rateDoc) {
            if (!item.itemName) item.itemName = rateDoc.itemName;
            item.calculatedAmount = rateDoc.rate * (item.quantity || 1);
          }
        } catch (error) {
          console.log('Error fetching rate:', error);
          item.calculatedAmount = 0;
        }
      }
      total += item.calculatedAmount || 0;
    }
    this.totalAmount = total;
  } else {
    this.totalAmount = 0;
  }
  next();
});

// Populate vendor and booking details
laundrySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'vendorId',
    select: 'vendorName phoneNumber UpiID isActive',
    match: { isActive: true }
  })
  .populate({
    path: 'bookingId',
    select: 'roomNumber guestName'
  })
  .populate({
    path: 'items.rateId',
    select: 'itemName rate category serviceType unit isActive',
    match: { isActive: true }
  });
  next();
});

module.exports = mongoose.model("Laundry", laundrySchema);