const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { auth, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Book room (Front Desk, Staff)
router.post("/book", auth, authorize(['FRONT DESK', 'STAFF']), upload.fields([
    { name: "idProofImageUrl", maxCount: 1 },
    { name: "idProofImageUrl2", maxCount: 1 },
    { name: "photoUrl", maxCount: 1 }
  ]), bookingController.bookRoom);

// Get all bookings (All roles)
router.get("/all", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getBookings);

// Get bookings by category (All roles)
router.get("/category/:categoryId", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getBookingsByCategory);

// Get next GRC (Front Desk, Staff)
router.get("/next-grc", auth, authorize(['FRONT DESK', 'STAFF']), bookingController.getNextGRC);

// Get booking by GRC (All roles)
router.get("/grc/:grcNo", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getBookingByGRC);

// Fetch details by GRC (All roles)
router.get("/fetch-by-grc/:grcNo", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getDetailsByGrc);

// Get customer details by GRC (All roles)
router.get("/customer/:grcNo", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getCustomerDetailsByGRC);

// Search customers (Front Desk, Staff, Accounts)
router.get("/search", auth, authorize(['FRONT DESK', 'STAFF', 'ACCOUNTS']), bookingController.searchCustomers);

// Get booking by ID (All roles)
router.get("/:bookingId", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getBookingById);

// Fix room availability (Admin only)
router.post("/fix-rooms", auth, authorize('ADMIN'), bookingController.fixRoomAvailability);

// Delete booking (Admin only)
router.delete("/unbook/:bookingId", auth, authorize('ADMIN'), bookingController.deleteBooking);

// Permanently delete booking (Admin only)
router.delete("/delete/:bookingId", auth, authorize('ADMIN'), bookingController.permanentlyDeleteBooking);

// Update booking (Front Desk, Staff, Admin, GM)
router.put("/update/:bookingId", auth, authorize(['FRONT DESK', 'STAFF', 'ADMIN', 'GM']), bookingController.updateBooking);

// Extend booking (Front Desk, Staff)
router.post("/extend/:bookingId", auth, authorize(['FRONT DESK', 'STAFF']), bookingController.extendBooking);

// Amend booking stay (Front Desk, Staff)
router.post("/amend/:bookingId", auth, authorize(['FRONT DESK', 'STAFF']), bookingController.amendBookingStay);

// Get conflicting bookings (Front Desk, Staff, Admin, GM)
router.get("/conflicts/:bookingId", auth, authorize(['FRONT DESK', 'STAFF', 'ADMIN', 'GM']), bookingController.getConflictingBookings);

// Checkout booking (Front Desk, Accounts)
router.post("/checkout/:bookingId", auth, authorize(['FRONT DESK', 'ACCOUNTS']), bookingController.checkoutBooking);

// Get booking history (Admin, GM, Accounts)
router.get("/history/all", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS']), bookingController.getBookingHistory);

// Get booking charges (Front Desk, Accounts, Admin)
router.get("/charges/booking/:bookingId", auth, authorize(['FRONT DESK', 'ACCOUNTS', 'ADMIN']), bookingController.getBookingCharges);

// Get booking charges by GRC (Front Desk, Accounts, Admin)
router.get("/charges/grc/:grcNo", auth, authorize(['FRONT DESK', 'ACCOUNTS', 'ADMIN']), bookingController.getBookingCharges);

module.exports = router;
