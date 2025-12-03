const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { auth, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Book room (Admin, Front Desk, Staff)
router.post("/book", auth, authorize(['ADMIN', 'FRONT DESK', 'STAFF']), upload.fields([
    { name: "idProofImageUrl", maxCount: 1 },
    { name: "idProofImageUrl2", maxCount: 1 },
    { name: "photoUrl", maxCount: 1 }
  ]), bookingController.bookRoom);

// Get all bookings (All roles)
router.get("/all", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getBookings);

// Get bookings by category (All roles)
router.get("/category/:categoryId", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getBookingsByCategory);

// Get next GRC (Admin, Front Desk, Staff)
router.get("/next-grc", auth, authorize(['ADMIN', 'FRONT DESK', 'STAFF']), bookingController.getNextGRC);

// Get booking by GRC (All roles)
router.get("/grc/:grcNo", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getBookingByGRC);

// Fetch details by GRC (All roles)
router.get("/fetch-by-grc/:grcNo", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getDetailsByGrc);

// Get customer details by GRC (All roles)
router.get("/customer/:grcNo", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getCustomerDetailsByGRC);

// Search customers (Admin, Front Desk, Staff, Accounts)
router.get("/search", auth, authorize(['ADMIN', 'FRONT DESK', 'STAFF', 'ACCOUNTS']), bookingController.searchCustomers);

// Get booking by booking number (All roles)
router.get("/booking-number/:bookingNo", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getBookingByNumber);

// Get booking by ID (All roles)
router.get("/:bookingId", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS', 'STAFF', 'FRONT DESK']), bookingController.getBookingById);

// Fix room availability (Admin only)
router.post("/fix-rooms", auth, authorize(['ADMIN']), bookingController.fixRoomAvailability);

// Delete booking (Admin only)
router.delete("/unbook/:bookingId", auth, authorize(['ADMIN']), bookingController.deleteBooking);

// Permanently delete booking (Admin only)
router.delete("/delete/:bookingId", auth, authorize(['ADMIN']), bookingController.permanentlyDeleteBooking);

// Update booking (Front Desk, Staff, Admin, GM)
router.put("/update/:bookingId", auth, authorize(['FRONT DESK', 'STAFF', 'ADMIN', 'GM']), bookingController.updateBooking);

// Extend booking (Admin, Front Desk, Staff)
router.post("/extend/:bookingId", auth, authorize(['ADMIN', 'FRONT DESK', 'STAFF']), bookingController.extendBooking);

// Amend booking stay (Admin, Front Desk, Staff)
router.post("/amend/:bookingId", auth, authorize(['ADMIN', 'FRONT DESK', 'STAFF']), bookingController.amendBookingStay);

// Get conflicting bookings (Front Desk, Staff, Admin, GM)
router.get("/conflicts/:bookingId", auth, authorize(['FRONT DESK', 'STAFF', 'ADMIN', 'GM']), bookingController.getConflictingBookings);

// Checkout booking (Admin, Front Desk, Accounts)
router.post("/checkout/:bookingId", auth, authorize(['ADMIN', 'FRONT DESK', 'ACCOUNTS']), bookingController.checkoutBooking);

// Get booking history (Admin, GM, Accounts)
router.get("/history/all", auth, authorize(['ADMIN', 'GM', 'ACCOUNTS']), bookingController.getBookingHistory);

// Get booking charges (Front Desk, Accounts, Admin)
router.get("/charges/booking/:bookingId", auth, authorize(['FRONT DESK', 'ACCOUNTS', 'ADMIN']), bookingController.getBookingCharges);

// Get booking charges by GRC (Front Desk, Accounts, Admin)
router.get("/charges/grc/:grcNo", auth, authorize(['FRONT DESK', 'ACCOUNTS', 'ADMIN']), bookingController.getBookingCharges);

module.exports = router;
