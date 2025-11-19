const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  number: { type: String, required: true, trim: true },
  whatsapp: { type: String, trim: true },
  pax: { type: Number, required: true, min: 1 },
  startDate: { type: Date, required: true },
 gst:{type:Number},

  ratePlan: { type: String, },
  advance: [
    {
      amount: { type: Number, required: true, min: 0 },
      date: { type: Date, default: Date.now },
      method: { 
        type: String, 
        enum: ["cash", "card", "upi", "wallet", "other"], 
        default: "cash" 
      },
      remarks: String
    }
  ],  
  total: { type: Number, },
  balance: { type: Number },
  ratePerPax: { type: Number }, // Rate per person
  paymentMethod: {
  type: String,
  enum: ["cash", "online", "card"],
  default: "cash"
},
transactionId: {
  type: String,
  trim: true
},
  discount:{type:Number},
  decorationCharge: { type: Number, default: 0 },
  musicCharge: { type: Number, default: 0 },
  hall:{
    type: String,
    enum: ["Kitty Hall", "Banquet Hall", "Rooftop Hall","Flamingo Rooftop"], 
  },
  extraRooms: { type: Number, default: 0 },
roomPricePerUnit: { type: Number, default: 0 },
extraRoomTotalPrice: { type: Number, default: 0 }, // Total price for extra rooms
roomOption: { type: String, enum: ['complimentary', 'additional', 'both'], default: 'complimentary' },
complimentaryRooms: {
  type: Number,
  default: 2 // or whatever your default is
},
mealPlan: {
  type: String,
  enum: ['With Breakfast', 'Without Breakfast'],
  default: 'Without Breakfast'
},
  time:{type: String, trim: true}, // Time of the bookin
foodType: {
  type: String,
  enum: ["Veg", "Non-Veg", "Both"], 
  default: "Veg",
},
functionType: {
type: String,
enum: ["Ring ceremony", "Wedding", "Tilak","Birthday","Anniversary","Mundan","Sangeet + Mehndi","Corporate meeting","Haldi function" ,"Farewell"],
default:"Wedding",
},
bookingStatus: {
  type: String,
  enum: ["Tentative", "Confirmed", "Enquiry"], 
  default: "Tentative",
},
  notes: { type: String, trim: true },
  menuItems: { type: String, trim: true }, // Comma-separated list of selected menu items
  categorizedMenu: { type: mongoose.Schema.Types.Mixed, default: {} }, // Menu items organized by category

  customerRef: { type: String, unique: true },
  
staffEditCount: { type: Number, default: 0 }, // Count of staff edits to the booking
 
  status: { type: Boolean, default: true }, // Whether the booking is confirmed or not
  isConfirmed: { type: Boolean, default: false }, // Whether the booking is confirmed or not
  isTentative: { type: Boolean, default: true }, // Whether the booking is tentative or not
  isEnquiry: { type: Boolean, default: false }, // Whether the booking is an enquiry or not
 statusHistory:[{
status:String,
changedAt:Date
 }],
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.models.BanquetBooking || mongoose.model("BanquetBooking", bookingSchema);
