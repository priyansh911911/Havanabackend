const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  room_number: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  extra_bed: {
    type: Boolean,
    default: false
  },
  is_reserved: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'booked', 'maintenance'], // ✅ Added "reserved"
    default: 'available'
  },
  description: {
    type: String
  },
  images: [{
    type: String
  }]
}, { timestamps: true });

// ✅ Prevent OverwriteModelError + cleaner export
module.exports = mongoose.models.Room || mongoose.model('Room', RoomSchema);
