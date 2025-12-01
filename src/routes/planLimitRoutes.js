const express = require("express");
const router = express.Router();
const {
  getAllPlanLimits,
  getPlanLimit,
  upsertPlanLimit,
  getFormattedLimits,
  initializeDefaults
} = require("../controllers/planLimitController");
const { auth, authorize } = require('../middleware/auth');

// Get all plan limits (All roles)
router.get("/get", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), getAllPlanLimits);

// Get formatted limits (All roles)
router.get("/formatted", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), getFormattedLimits);

// Get specific plan limit (All roles)
router.get("/:ratePlan/:foodType", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), getPlanLimit);

// Upsert plan limit (Admin, GM)
router.post("/", auth, authorize(['ADMIN', 'GM']), upsertPlanLimit);

// Initialize defaults (Admin only)
router.post("/initialize", auth, authorize('ADMIN'), initializeDefaults);

module.exports = router;
