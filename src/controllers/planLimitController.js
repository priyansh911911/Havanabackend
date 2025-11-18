const PlanLimit = require("../models/PlanLimit");
const BanquetCategory = require("../models/banquetCategory");

// Get all plan limits
exports.getAllPlanLimits = async (req, res) => {
  try {
    const limits = await PlanLimit.find().sort({ ratePlan: 1, foodType: 1 });
    res.json({ success: true, data: limits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get limits for specific plan and food type
exports.getPlanLimit = async (req, res) => {
  try {
    const { ratePlan, foodType } = req.params;
    
    const limit = await PlanLimit.findOne({ ratePlan, foodType });
    if (!limit) {
      return res.status(404).json({ success: false, message: "Plan limit not found" });
    }
    
    res.json({ success: true, data: limit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create or update plan limit
exports.upsertPlanLimit = async (req, res) => {
  try {
    const { ratePlan, foodType, limits } = req.body;
    
    // Convert ObjectId keys to category names before saving
    const categories = await BanquetCategory.find().lean();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat._id.toString()] = cat.cateName;
    });
    
    const convertedLimits = {};
    for (let [key, value] of Object.entries(limits)) {
      const categoryName = categoryMap[key] || key;
      convertedLimits[categoryName] = value;
    }
    
    const planLimit = await PlanLimit.findOneAndUpdate(
      { ratePlan, foodType },
      { ratePlan, foodType, limits: convertedLimits },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: planLimit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get formatted limits (like your current JSON structure)
exports.getFormattedLimits = async (req, res) => {
  try {
    const limits = await PlanLimit.find();
    
    const formatted = {};
    limits.forEach(limit => {
      if (!formatted[limit.ratePlan]) formatted[limit.ratePlan] = {};
      formatted[limit.ratePlan][limit.foodType] = limit.limits;
    });
    
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Initialize default plan limits if none exist
exports.initializeDefaults = async (req, res) => {
  try {
    const existingCount = await PlanLimit.countDocuments();
    if (existingCount > 0) {
      return res.json({ success: true, message: "Plan limits already exist" });
    }

    const defaultLimits = [
      {
        ratePlan: "Silver", foodType: "Veg",
        limits: { STARTERS_GROUP: 3, BEVERAGES: 3, SOUP_VEG: 1, MAIN_COURSE_PANEER: 1, VEGETABLES: 2, MAIN_COURSE_GHAR_KA_SWAD: 1, RICE: 1, INDIAN_BREADS: 3, SALAD_BAR: 2, CURD_AND_RAITA: 1, DESSERTS: 1, ICE_CREAM: 1, WATER: 1, LIVE_COUNTER: 0 }
      },
      {
        ratePlan: "Silver", foodType: "Non-Veg",
        limits: { STARTERS_GROUP: 3, BEVERAGES: 2, SOUP_VEG: 1, SOUP_NON_VEG: 0, MAIN_COURSE_PANEER: 1, MAIN_COURSE_CHICKEN: 1, MAIN_COURSE_FISH_WITH_BONE: 0, MAIN_COURSE_MUTTON: 0, VEGETABLES: 2, MAIN_COURSE_GHAR_KA_SWAD: 1, RICE: 1, INDIAN_BREADS: 3, SALAD_BAR: 2, CURD_AND_RAITA: 1, DESSERTS: 1, ICE_CREAM: 1, WATER: 1, LIVE_COUNTER: 0 }
      },
      {
        ratePlan: "Gold", foodType: "Veg",
        limits: { STARTERS_GROUP: 4, BEVERAGES: 3, SOUP_VEG: 2, MAIN_COURSE_PANEER: 1, VEGETABLES: 2, MAIN_COURSE_GHAR_KA_SWAD: 1, RICE: 1, INDIAN_BREADS: 5, SALAD_BAR: 3, CURD_AND_RAITA: 2, DESSERTS: 2, ICE_CREAM: 1, WATER: 1, LIVE_COUNTER: 0 }
      },
      {
        ratePlan: "Gold", foodType: "Non-Veg",
        limits: { STARTERS_GROUP: 5, BEVERAGES: 3, SOUP_VEG: 1, SOUP_NON_VEG: 1, MAIN_COURSE_CHICKEN: 1, MAIN_COURSE_MUTTON: 1, MAIN_COURSE_FISH_WITH_BONE: 1, MAIN_COURSE_PANEER: 1, VEGETABLES: 2, MAIN_COURSE_GHAR_KA_SWAD: 1, RICE: 1, INDIAN_BREADS: 5, SALAD_BAR: 3, CURD_AND_RAITA: 2, DESSERTS: 2, ICE_CREAM: 1, WATER: 1, LIVE_COUNTER: 0 }
      },
      {
        ratePlan: "Platinum", foodType: "Veg",
        limits: { STARTERS_GROUP: 8, BEVERAGES: 3, SOUP_VEG: 2, MAIN_COURSE_PANEER: 2, VEGETABLES: 3, MAIN_COURSE_GHAR_KA_SWAD: 2, RICE: 2, INDIAN_BREADS: 6, SALAD_BAR: 5, CURD_AND_RAITA: 2, DESSERTS: 3, ICE_CREAM: 2, WATER: 1, LIVE_COUNTER: 0 }
      },
      {
        ratePlan: "Platinum", foodType: "Non-Veg",
        limits: { STARTERS_GROUP: 8, BEVERAGES: 3, SOUP_VEG: 1, SOUP_NON_VEG: 1, MAIN_COURSE_CHICKEN: 1, MAIN_COURSE_MUTTON: 1, MAIN_COURSE_FISH_WITH_BONE: 1, MAIN_COURSE_PANEER: 2, VEGETABLES: 3, MAIN_COURSE_GHAR_KA_SWAD: 2, RICE: 2, INDIAN_BREADS: 6, SALAD_BAR: 5, CURD_AND_RAITA: 2, DESSERTS: 3, ICE_CREAM: 2, WATER: 1, LIVE_COUNTER: 1 }
      }
    ];

    await PlanLimit.insertMany(defaultLimits);
    res.json({ success: true, message: "Default plan limits initialized" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};