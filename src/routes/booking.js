const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

router.post("/book", bookingController.bookRoom);
router.get("/all", bookingController.getBookings);
router.get("/category/:categoryId", bookingController.getBookingsByCategory);
router.get("/grc/:grcNo", bookingController.getBookingByGRC);
router.get("/:bookingId", bookingController.getBookingById);
router.get("/fetch-by-grc/:grcNo", bookingController.getDetailsByGrc);
router.delete("/unbook/:bookingId", bookingController.deleteBooking);
router.delete("/delete/:bookingId", bookingController.permanentlyDeleteBooking);
router.put("/update/:bookingId", bookingController.updateBooking);
router.post("/extend/:bookingId", bookingController.extendBooking);
router.post("/checkout/:bookingId", bookingController.checkoutBooking);
router.get("/history/all", bookingController.getBookingHistory);

module.exports = router;
