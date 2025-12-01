const express = require("express");
const router = express.Router();
const {
  getAllMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuByFoodType
} = require("../controllers/menuItemController");
const { auth, authorize } = require('../middleware/auth');

// Get all menu items (All roles)
router.get("/", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), getAllMenuItems);

// Get menu by food type (All roles)
router.get("/foodtype/:foodType", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), getMenuByFoodType);

// Add menu item (Admin, GM)
router.post("/", auth, authorize(['ADMIN', 'GM']), addMenuItem);

// Update menu item (Admin, GM)
router.put("/:id", auth, authorize(['ADMIN', 'GM']), updateMenuItem);

// Delete menu item (Admin only)
router.delete("/:id", auth, authorize('ADMIN'), deleteMenuItem);

module.exports = router;
