const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  grcNo: { type: String, unique: true, required: true },  // Guest Registration Card No
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

  bookingDate: { type: Date, default: Date.now },
  numberOfRooms: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  days: { type: Number },
  timeIn: { type: String },
  timeOut: {
    type: String,
    default: '12:00',
    immutable: true 
  },  

  salutation: { type: String, enum: ['mr.', 'mrs.', 'ms.', 'dr.', 'other'], default: 'mr.' },
  name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  address: { type: String },
  city: { type: String },
  nationality: { type: String },
  mobileNo: { type: String, required: true },
  email: { type: String },
  phoneNo: { type: String },
  birthDate: { type: Date },
  anniversary: { type: Date },

  companyName: { type: String },
  companyGSTIN: { type: String },

  idProofType: {
    type: String,
    enum: ['Aadhaar', 'PAN', 'Voter ID', 'Passport', 'Driving License', 'Other']
  },  idProofNumber: { type: String },
  idProofImageUrl: { type: String },
  idProofImageUrl2: { type: String },
  photoUrl: { type: String },

  roomNumber: { type: String },
  planPackage: { type: String }, //cp map/ mp
  noOfAdults: { type: Number },
  noOfChildren: { type: Number },
  roomGuestDetails: [{
    roomNumber: { type: String, required: true },
    adults: { type: Number, default: 1, min: 1 },
    children: { type: Number, default: 0, min: 0 }
  }],
  roomRates: [{
    roomNumber: { type: String, required: true },
    customRate: { type: Number, default: 0 },
    extraBed: { type: Boolean, default: false },
    extraBedStartDate: { type: Date, default: null }
  }],
  extraBed: { type: Boolean, default: false },
  extraBedCharge: { type: Number, default: 0 },
  extraBedRooms: [{ type: String }], // Array of room numbers that have extra beds
  rate: { type: Number },
  taxableAmount: { type: Number },
  cgstAmount: { type: Number },
  sgstAmount: { type: Number },
  cgstRate: { type: Number, default: 0.025 },
  sgstRate: { type: Number, default: 0.025 },
  taxIncluded: { type: Boolean, default: false },
  serviceCharge: { type: Boolean, default: false },

  arrivedFrom: { type: String },
  destination: { type: String },
  remark: { type: String },
  businessSource: { type: String },
  marketSegment: { type: String },
  purposeOfVisit: { type: String },

  discountPercent: { type: Number, default: 0 },
  discountRoomSource: { type: Number, default: 0 },

  paymentMode: { type: String },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Failed', 'Partial'],
    default: 'Pending'
  },

  // Multiple Advance Payments
  advancePayments: [{
    amount: { type: Number, required: true },
    paymentMode: { type: String, required: true },
    paymentDate: { type: Date, required: true },
    reference: { type: String },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  totalAdvanceAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },

  bookingRefNo: { type: String },
  
  mgmtBlock: { type: String, enum: ['Yes', 'No'], default: 'No' },
  billingInstruction: { type: String },

  temperature: { type: Number },

  fromCSV: { type: Boolean, default: false },
  epabx: { type: Boolean, default: false },
  vip: { type: Boolean, default: false },

  status: { 
    type: String, 
    enum: ['Booked', 'Checked In', 'Checked Out', 'Cancelled'], 
    default: 'Booked' 
  },

  // 🔹 Extension History
  extensionHistory: [
    {
      originalCheckIn: { type: Date },
      originalCheckOut: { type: Date },
      extendedCheckOut: { type: Date },
      extendedOn: { type: Date, default: Date.now },
      reason: String,
      additionalAmount: Number,
      paymentMode: {
        type: String,
        enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other']
      },
      approvedBy: String
    }
  ],

  // 🔹 Amendment History
  amendmentHistory: [
    {
      originalCheckIn: { type: Date },
      originalCheckOut: { type: Date },
      originalDays: { type: Number },
      newCheckIn: { type: Date },
      newCheckOut: { type: Date },
      newDays: { type: Number },
      amendedOn: { type: Date, default: Date.now },
      reason: String,
      rateAdjustment: { type: Number, default: 0 },
      extraBedAdjustment: { type: Number, default: 0 },
      totalAdjustment: { type: Number, default: 0 },
      status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Approved' },
      approvedBy: String,
      approvedOn: Date
    }
  ],
}, { timestamps: true });

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
