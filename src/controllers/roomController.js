const Room = require("../models/Room.js");
const Category = require("../models/Category.js");
const Booking = require("../models/Booking.js");

// Create a new room
exports.createRoom = async (req, res) => {
  try {
    const {
      title,
      category,
      room_number,
      price,
      extra_bed,
      is_reserved,
      status,
      description,
      images,
    } = req.body;
    const room = new Room({
      title,
      categoryId: category,
      room_number, // Ensure room_number is included
      price,
      extra_bed,
      is_reserved,
      status,
      description,
      images,
    });
    await room.save();

    // Count rooms per category and get all room numbers for the created room's category
    const categories = await Room.aggregate([
      {
        $group: {
          _id: "$categoryId",
          count: { $sum: 1 },
          roomNumbers: { $push: "$room_number" },
        },
      },
    ]);

    // Populate category names

    const populated = await Promise.all(
      categories.map(async (cat) => {
        const categoryDoc = await Category.findById(cat._id);
        return {
          category: categoryDoc?.name || "Unknown",
          count: cat.count,
          roomNumbers: cat.roomNumbers,
        };
      })
    );

    res.status(201).json({
      room,
      summary: populated,
      allocatedRoomNumber: room.room_number,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all rooms
exports.getRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate("categoryId")
      .maxTimeMS(5000)
      .lean()
      .exec();
    
    // Map rooms to ensure safe access to category properties
    const safeRooms = rooms.map(room => {
      if (!room.categoryId) {
        room.categoryId = { name: 'Unknown' };
      }
      return room;
    });
    
    res.json(safeRooms);
  } catch (error) {
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      res.status(408).json({ error: 'Database query timeout. Please try again.' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

// Get a room by ID
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("categoryId");
    if (!room) return res.status(404).json({ error: "Room not found" });
    
    // Ensure safe access to category properties
    const safeRoom = room.toObject();
    if (!safeRoom.categoryId) {
      safeRoom.categoryId = { name: 'Unknown' };
    };
    
    res.json(safeRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a room
exports.updateRoom = async (req, res) => {
  try {
    const updates = req.body;
    const room = await Room.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a room
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json({ message: "Room deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get rooms by category with booking status
exports.getRoomsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const rooms = await Room.find({ categoryId: categoryId }).populate("categoryId");
    const activeBookings = await Booking.find({
      categoryId: categoryId,
      isActive: true,
    });
    
    // Handle comma-separated room numbers in bookings
    const bookedRoomNumbers = new Set();
    activeBookings.forEach(booking => {
      if (booking.roomNumber) {
        const roomNums = booking.roomNumber.split(',').map(num => num.trim());
        roomNums.forEach(num => bookedRoomNumbers.add(num));
      }
    });

    const roomsWithStatus = rooms.map((room) => {
      // Ensure safe access to category properties
      const category = room.categoryId || { name: 'Unknown' };
      
      return {
        _id: room._id,
        title: room.title,
        room_number: room.room_number,
        price: room.price,
        status: room.status,
        categoryId: category,
        isBooked: bookedRoomNumbers.has(room.room_number.toString()),
        canSelect:
          !bookedRoomNumbers.has(room.room_number.toString()) &&
          room.status === "available",
      };
    });

    res.json({ success: true, rooms: roomsWithStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update room status directly
exports.updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['available', 'reserved', 'booked', 'maintenance'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    
    const room = await Room.findById(id);
    if (!room) return res.status(404).json({ error: "Room not found" });
    
    room.status = status;
    await room.save();
    
    res.json({ success: true, room });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Get rooms available between checkInDate and checkOutDate
exports.getAvailableRooms = async (req, res) => {
  try {
    const { checkInDate, checkOutDate } = req.query;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        message: "checkInDate and checkOutDate are required",
      });
    }

    // Parse dates and set to start/end of day for proper comparison
    const checkIn = new Date(checkInDate + 'T00:00:00.000Z');
    const checkOut = new Date(checkOutDate + 'T23:59:59.999Z')

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format" });
    }

    // Step 1: Find overlapping bookings (rooms that are NOT available)
    const overlappingBookings = await Booking.find({
      isActive: true,
      status: { $in: ['Booked', 'Checked In'] },
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn }
    })
    .maxTimeMS(5000)
    .lean()
    .exec();
    


    // Step 2: Extract roomNumbers from those bookings (handle comma-separated room numbers)
    const bookedRoomNumbers = [];
    overlappingBookings.forEach(booking => {
      if (booking.roomNumber) {
        const roomNums = booking.roomNumber.split(',').map(num => num.trim());
        bookedRoomNumbers.push(...roomNums);
      }
    });

    // Step 3: Find rooms not in that list (ignore room status for future bookings)
    const availableRooms = await Room.find({
      room_number: { $nin: bookedRoomNumbers }
    })
    .populate("categoryId", "name")
    .maxTimeMS(5000)
    .lean()
    .exec();

    // Step 4: Group by category
    const grouped = {};

    availableRooms.forEach((room) => {
      const catId = room.categoryId?._id?.toString() || "uncategorized";
      const catName = room.categoryId?.name || "Uncategorized";
      
      if (!grouped[catId]) {
        grouped[catId] = {
          category: catId,
          categoryName: catName,
          rooms: [],
        };
      }

      grouped[catId].rooms.push({
        _id: room._id,
        title: room.title,
        room_number: room.room_number,
        price: room.price,
        description: room.description,
        status: 'available', // Override status since room is available for requested dates
      });
    });


    return res.json({
      success: true,
      availableRooms: Object.values(grouped),
      totalCount: availableRooms.length,
    });
  } catch (err) {
    console.error("Error in getAvailableRooms:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};