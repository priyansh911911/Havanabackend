const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { auth, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/book", auth, upload.fields([
    { name: "idProofImageUrl", maxCount: 1 },
    { name: "idProofImageUrl2", maxCount: 1 },
    { name: "photoUrl", maxCount: 1 }
  ]), bookingController.bookRoom);
router.get("/all", auth, bookingController.getBookings);
router.get("/category/:categoryId", auth, bookingController.getBookingsByCategory);
router.get("/grc/:grcNo", auth, bookingController.getBookingByGRC);
router.get("/:bookingId", auth, bookingController.getBookingById);
router.get("/fetch-by-grc/:grcNo", auth, bookingController.getDetailsByGrc);
router.get("/customer/:grcNo", auth, bookingController.getCustomerDetailsByGRC);
router.get("/search", auth, bookingController.searchCustomers);
router.post("/fix-rooms", auth, authorize('admin'), bookingController.fixRoomAvailability);
router.delete("/unbook/:bookingId", auth, authorize('admin'), bookingController.deleteBooking);
router.delete("/delete/:bookingId", auth, authorize('admin'), bookingController.permanentlyDeleteBooking);
router.put("/update/:bookingId", auth, bookingController.updateBooking);
router.post("/extend/:bookingId", auth, bookingController.extendBooking);
router.post("/checkout/:bookingId", auth, bookingController.checkoutBooking);
router.get("/history/all", auth, bookingController.getBookingHistory);

module.exports = router;
