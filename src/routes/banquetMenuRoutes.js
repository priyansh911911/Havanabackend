const express = require("express");
const router = express.Router();
const {
getMenuByBookingId,getMenuByCustomerRef,updateMenuByCustomerRef,createMenu} = require("../controllers/banquetmenuController");
const { auth, authorize } = require('../middleware/auth');

// Create banquet menu (Staff, Front Desk)
router.post("/create", auth, authorize(['STAFF', 'FRONT DESK']), createMenu);

// Get menu by booking ID (All roles)
router.get("/:bookingId", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), getMenuByBookingId);

// Get menu by customer reference (All roles)
router.get("/all/:customerRef", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), getMenuByCustomerRef);

// Update menu by customer reference (Staff, Front Desk, Admin, GM)
router.put("/update/:customerRef", auth, authorize(['STAFF', 'FRONT DESK', 'ADMIN', 'GM']), updateMenuByCustomerRef);
module.exports = router;
