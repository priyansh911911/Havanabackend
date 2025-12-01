const express = require("express");
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/banquetCategoryController");
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Create banquet category (Admin, GM)
router.post("/create", auth, authorize(['ADMIN', 'GM']), createCategory);

// Get all banquet categories (All roles)
router.get("/all", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), getCategories);

// Get banquet category by ID (All roles)
router.get("/get/:id", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), getCategoryById);

// Update banquet category (Admin, GM)
router.put("/update/:id", auth, authorize(['ADMIN', 'GM']), updateCategory);

// Delete banquet category (Admin only)
router.delete("/delete/:id", auth, authorize('ADMIN'), deleteCategory);

module.exports = router;
