const mongoose = require("mongoose");

const laundrySchema = new mongoose.Schema({
  orderType: {
    type: String,
    enum: ["hotel_laundry", "room_laundry"],
    required: true
  },
  grcNo: String,
  invoiceNumber: String,
  roomNumber: String,
  requestedByName: String,
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking"
  },
  serviceType: {
    type: String,
    enum: ["inhouse", "vendor"],
    required: true,
    default: "inhouse"
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LaundryVendor",
    required: function() { return this.serviceType === 'vendor'; }
  },
  items: [{
    rateId: { type: mongoose.Schema.Types.ObjectId, ref: "LaundryItem", required: true },
    itemName: String,
    quantity: { type: Number, default: 1, min: 0 },
    deliveredQuantity: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pending", "picked_up", "ready", "delivered", "cancelled"],
      default: "pending"
    },
    calculatedAmount: { type: Number, default: 0 },
    damageReported: { type: Boolean, default: false },
    serviceType: String,
    itemNotes: String
  }],
  laundryStatus: {
    type: String,
    enum: ["pending", "picked_up", "ready", "delivered", "cancelled"],
    default: "pending"
  },
  totalAmount: { type: Number, default: 0 },
  vendorOrderId: String,
  vendorNotes: String,
  vendorPickupTime: Date,
  vendorDeliveryTime: Date
}, { timestamps: true });


laundrySchema.pre("save", async function (next) {
  if (this.bookingId && (this.isNew || this.isModified('bookingId'))) {
    try {
      const booking = await mongoose.model("Booking").findById(this.bookingId);
      if (booking) {
        if (!this.roomNumber) this.roomNumber = booking.roomNumber;
        if (!this.grcNo) this.grcNo = booking.grcNo;
        if (!this.requestedByName) this.requestedByName = booking.guestName;
      }
    } catch (error) {
      console.log('Error fetching booking:', error);
    }
  }

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
          item.calculatedAmount = 0;
        }
      }
      total += item.calculatedAmount || 0;
    }
    this.totalAmount = total;
  }
  next();
});

laundrySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'vendorId',
    select: 'vendorName phoneNumber isActive'
  })
  .populate({
    path: 'bookingId',
    select: 'roomNumber guestName grcNo'
  })
  .populate({
    path: 'items.rateId',
    select: 'itemName rate categoryId'
  });
  next();
});

module.exports = mongoose.model("Laundry", laundrySchema);