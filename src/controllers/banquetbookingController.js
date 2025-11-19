const BanquetBooking = require("../models/banquetBooking");
const Menu = require("../models/BanquetMenu");
const generateCustomerRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = '';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};
exports.createBooking = async (req, res) => {
  try {
    // Generate unique customerRef
    let customerRef;
    let refExists = true;

    while (refExists) {
      customerRef = generateCustomerRef();
      refExists = await Menu.exists({ customerRef });
    }

    const bookingData = { ...req.body };

    // Convert numeric fields safely
    const numericFields = [
      'pax', 'total', 'balance', 'ratePerPax', 'discount', 'gst',
      'extraRooms', 'roomPricePerUnit', 'extraRoomTotalPrice',
      'complimentaryRooms', 'staffEditCount'
    ];
    numericFields.forEach(f => {
      if (bookingData[f]) bookingData[f] = Number(bookingData[f]);
    });

    // Ensure categorizedMenu is preserved in booking data
    if (req.body.categorizedMenu) {
      bookingData.categorizedMenu = req.body.categorizedMenu;
    }

    // ✅ Handle advance array properly
    if (Array.isArray(bookingData.advance)) {
      bookingData.advance = bookingData.advance.map(a => ({
        amount: Number(a.amount) || 0,
        date: a.date ? new Date(a.date) : new Date(),
        method: a.method || "cash",
        remarks: a.remarks || "",
      }));
    } else {
      bookingData.advance = [];
    }

    // Attach customerRef
    bookingData.customerRef = customerRef;

    // Create booking
    const booking = await BanquetBooking.create(bookingData);
    console.log("Booking created:", booking);

    // Handle categorizedMenu
    if (req.body.categorizedMenu) {
      const menu = new Menu({
        categories: req.body.categorizedMenu,
        bookingRef: booking._id,
        customerRef: customerRef
      });
      await menu.save();
      console.log("Menu created with bookingRef:", booking._id);
    }

    res.status(201).json({ message: "Success", booking });
  } catch (err) {
    console.error("Full error:", {
      message: err.message,
      stack: err.stack,
      receivedData: req.body
    });
    res.status(500).json({
      message: "Error creating booking",
      error: err.message,
    });
  }
};

// @desc    Get all bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await BanquetBooking.find().sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err.message);
    res.status(500).json({
      message: "Server error while fetching bookings",
      error: err.message,
    });
  }
};

// @desc    Get a single booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await BanquetBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Fetch the associated menu
    const menu = await Menu.findOne({ bookingRef: req.params.id });

    // Debug log
    console.log("Booking:", booking);
    console.log("Menu (categorizedMenu):", menu);

    res.status(200).json({
      ...booking.toObject(),
      categorizedMenuFromCollection: menu ? menu.toObject() : null
    });
  } catch (err) {
    console.error("Error fetching booking:", err.message);
    res.status(500).json({
      message: "Server error while fetching booking",
      error: err.message,
    });
  }
};

// @desc    Update a booking by ID
// exports.updateBooking = async (req, res) => {
//   try {
//     const updatedData = req.body;

//     // Auto-recalculate balance if advance or total changed
//     if (
//       updatedData.total &&
//       updatedData.advance &&
//       (updatedData.balance === undefined || updatedData.balance === "")
//     ) {
//       updatedData.balance = updatedData.total - updatedData.advance;
//     }

//     const updatedBooking = await Booking.findByIdAndUpdate(
//       req.params.id,
//       updatedData,
//       { new: true, runValidators: true }
//     );

//     if (!updatedBooking) {
//       return res.status(404).json({ message: "Booking not found" });
//     }

//     res.status(200).json({
//       message: "Booking updated successfully",
//       booking: updatedBooking,
//     });
//   } catch (err) {
//     console.error("Error updating booking:", err.message);
//     res.status(500).json({
//       message: "Server error while updating booking",
//       error: err.message,
//     });
//   }
// };

exports.updateBooking = async (req, res) => {
  try {
    const updatedData = { ...req.body };

    // 1️⃣ Find existing booking
    const booking = await BanquetBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 2️⃣ Handle advance array
    if (Array.isArray(updatedData.advance) && updatedData.advance.length > 0) {
      const newAdvances = updatedData.advance.map(a => ({
        amount: Number(a.amount) || 0,
        date: a.date ? new Date(a.date) : new Date(),
        method: a.method || "cash",
        remarks: a.remarks || "",
      }));
      booking.advance = [...(booking.advance || []), ...newAdvances];
    }

    // 3️⃣ Recalculate totalAdvance + balance
    const totalAdvance = (booking.advance || []).reduce((sum, a) => sum + (a.amount || 0), 0);
    if (updatedData.total) booking.total = Number(updatedData.total);
    booking.balance = (booking.total || 0) - totalAdvance;

    // 4️⃣ Append to statusHistory
    if (Array.isArray(updatedData.statusHistory) && updatedData.statusHistory.length > 0) {
      updatedData.statusHistory.forEach(newEntry => {
        const exists = booking.statusHistory.some(
          entry =>
            entry.status === newEntry.status &&
            new Date(entry.changedAt).getTime() === new Date(newEntry.changedAt).getTime()
        );
        if (!exists) booking.statusHistory.push(newEntry);
      });
      delete updatedData.statusHistory;
    }

    // 5️⃣ Assign other fields including mealPlan
    const ignoredFields = ["advance", "total"];
    Object.keys(updatedData).forEach(key => {
      if (!ignoredFields.includes(key)) {
        // ✅ Special handling for mealPlan to validate enum
        if (key === "mealPlan") {
          const validOptions = ["With Breakfast", "Without Breakfast"];
          booking.mealPlan = validOptions.includes(updatedData.mealPlan)
            ? updatedData.mealPlan
            : "Without Breakfast"; // default
        } else {
          booking[key] = updatedData[key];
        }
      }
    });

    // 6️⃣ STAFF MENU EDIT LIMIT LOGIC
    const role = (req.body.role || req.body.rolr || "staff").toLowerCase();
    if (role !== "admin" && req.body.categorizedMenu) {
      if (typeof booking.staffEditCount !== "number") booking.staffEditCount = 0;
      if (booking.staffEditCount >= 2) {
        return res.status(403).json({ message: "Staff menu edit limit reached for this booking." });
      }
      booking.staffEditCount += 1;
    }

    // 7️⃣ Save the booking
    await booking.save();

    // 8️⃣ MENU UPDATE LOGIC
    if (updatedData.categorizedMenu && booking.customerRef) {
      let menu = await Menu.findOne({ bookingRef: booking._id });
      if (menu) {
        menu.categories = updatedData.categorizedMenu;
        menu.customerRef = booking.customerRef;
        await menu.save();
      } else {
        menu = new Menu({
          categories: updatedData.categorizedMenu,
          bookingRef: booking._id,
          customerRef: booking.customerRef
        });
        await menu.save();
      }
    }

    // ✅ Response
    res.status(200).json({
      message: "Booking and Menu updated successfully",
      booking,
    });

  } catch (err) {
    console.error("Error updating booking:", err.message);
    res.status(500).json({
      message: "Server error while updating booking",
      error: err.message,
    });
  }
};


// @desc    Delete a booking by ID
exports.deleteBooking = async (req, res) => {
  try {
    const deletedBooking = await BanquetBooking.findByIdAndDelete(req.params.id);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting booking:", err.message);
    res.status(500).json({
      message: "Server error while deleting booking",
      error: err.message,
    });
  }
};


exports.getAllPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;  // Show 10 bookings per page
    const skip = (page - 1) * limit;

    // Fetch bookings with pagination and sorting
    const bookings = await BanquetBooking.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });  // Most recent bookings first

    if (!bookings || bookings.length === 0) {
      return res.status(200).json({
        message: 'No bookings found',
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
        limit,
      });
    }

    const totalCount = await BanquetBooking.countDocuments();

    res.status(200).json({
      message: 'Bookings fetched successfully',
      data: bookings,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      limit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.searchBooking = async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res
      .status(400)
      .json({ message: "Please enter a search query", success: false });
  }

  try {
    const bookings = await BanquetBooking.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
   
      ],
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found!", success: false });
    }

    res.status(200).json({ data: bookings, success: true });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};