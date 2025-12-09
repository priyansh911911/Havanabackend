const mongoose = require("mongoose");

const laundrySchema = new mongoose.Schema({
  // 🧾 Basic Guest + Room Info
  orderType: {
    type: String,
    enum: ["hotel_laundry", "room_laundry"],
    required: true
  },
  grcNo: String,
  invoiceNumber: String,
  roomNumber: String,
  requestedByName: String, // Guest name

  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",  
  },

  // 🏢 Service Type & Vendor Assignment
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
      serviceType: { type: String}, //dry_clean", "wash", "press
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


// Auto-fill booking details and calculate totals
laundrySchema.pre("save", async function (next) {
  // Auto-fill from booking if bookingId provided
  if (this.bookingId && (this.isNew || this.isModified('bookingId'))) {
    try {
      const booking = await mongoose.model("Booking").findById(this.bookingId);
      if (booking) {
        if (!this.roomNumber) this.roomNumber = booking.roomNumber;
        if (!this.grcNo) this.grcNo = booking.grcNo;
        if (!this.invoiceNumber) this.invoiceNumber = booking.invoiceNumber;
        if (!this.requestedByName) this.requestedByName = booking.guestName;
      }
    } catch (error) {
      console.log('Error fetching booking:', error);
    }
  }

  // Auto-calc total + auto-fill item details from LaundryItem
  if (this.items?.length) {
    let total = 0;
    for (let item of this.items) {
      if (item.rateId) {
        try {
          const rateDoc = await mongoose.model("LaundryItem").findById(item.rateId);
          if (rateDoc) {
            if (!item.itemName) item.itemName = rateDoc.itemName;
            if (!item.serviceType && item.serviceType !== '') item.serviceType = item.serviceType || '';
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
    select: 'roomNumber guestName invoiceNumber grcNo'
  });
  next();
});

// Dynamic populate based on serviceType
laundrySchema.post(/^find/, async function(docs) {
  if (!docs) return;
  
  const documents = Array.isArray(docs) ? docs : [docs];
  
  for (let doc of documents) {
    if (doc && doc.items && doc.items.length > 0) {
      const populateQuery = {
        isActive: true
      };
      
      // If vendor order, only show vendor's items
      if (doc.serviceType === 'vendor' && doc.vendorId) {
        populateQuery.vendorId = doc.vendorId._id || doc.vendorId;
      }
      // If inhouse order, only show items without vendorId
      else if (doc.serviceType === 'inhouse') {
        populateQuery.vendorId = { $exists: false };
      }
      
      await doc.populate({
        path: 'items.rateId',
        select: 'itemName rate categoryId unit vendorId isActive',
        match: populateQuery,
        populate: {
          path: 'categoryId',
          select: 'categoryName description isActive'
        }
      });
    }
  }
});

module.exports = mongoose.model("Laundry", laundrySchema);