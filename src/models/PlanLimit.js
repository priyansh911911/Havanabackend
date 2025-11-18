const mongoose = require("mongoose");

const planLimitSchema = new mongoose.Schema({
  ratePlan: {
    type: String,
    required: true,
    enum: ["Silver", "Gold", "Platinum"]
  },
  foodType: {
    type: String,
    required: true,
    enum: ["Veg", "Non-Veg"]
  },
  limits: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Ensure unique combination of ratePlan and foodType
planLimitSchema.index({ ratePlan: 1, foodType: 1 }, { unique: true });

module.exports = mongoose.model("PlanLimit", planLimitSchema);