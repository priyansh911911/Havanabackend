const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic required fields for login/registration
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK'], required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  
  // Optional fields - to be updated by admin later
  validId: { 
    type: String, 
    enum: ['aadhar', 'pan', 'passport', 'driving_license', 'voter_id']
  },
  phoneNumber: { type: String },
  dateOfJoining: { type: Date },
  photo: { type: String },
  
  // Bank Details - optional
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    accountHolderName: String
  },
  
  // Salary Details - optional
  salaryDetails: {
    basicSalary: Number,
    allowances: Number,
    deductions: Number,
    netSalary: Number
  }
}, { timestamps: true });

const bcrypt = require('bcryptjs');

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
