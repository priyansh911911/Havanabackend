const mongoose = require('mongoose');

const housekeepingSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true
  },
  taskType: {
    type: String,
    enum: ['cleaning', 'maintenance', 'inspection', 'deep_cleaning'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 30
  },
  actualTime: {
    type: Number // in minutes
  },
  startTime: {
    type: Date
  },
  completedTime: {
    type: Date
  },
  createdBy: {
    type: String,
    required: true
  },
  grcNo: {
    type: String
  },
  checklistItems: [{
    item: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  images: [{
    url: String,
    description: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Housekeeping', housekeepingSchema);