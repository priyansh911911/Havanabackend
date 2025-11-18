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
      category,
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
          _id: "$category",
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
    const rooms = await Room.find().populate("category");
    
    // Map rooms to ensure safe access to category properties
    const safeRooms = rooms.map(room => {
      const roomObj = room.toObject();
      if (!roomObj.category) {
        roomObj.category = { name: 'Unknown' };
      }
      return roomObj;
    });
    
    res.json(safeRooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a room by ID
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("category");
    if (!room) return res.status(404).json({ error: "Room not found" });
    
    // Ensure safe access to category properties
    const safeRoom = room.toObject();
    if (!safeRoom.category) {
      safeRoom.category = { name: 'Unknown' };
    }
    
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

    const rooms = await Room.find({ category: categoryId }).populate("category");
    const activeBookings = await Booking.find({
      category: categoryId,
      isActive: true,
    });
    const bookedRoomNumbers = new Set(
      activeBookings.map((booking) => booking.roomNumber)
    );

    const roomsWithStatus = rooms.map((room) => {
      // Ensure safe access to category properties
      const category = room.category || { name: 'Unknown' };
      
      return {
        _id: room._id,
        title: room.title,
        room_number: room.room_number,
        price: room.price,
        status: room.status,
        category: category,
        isBooked: bookedRoomNumbers.has(parseInt(room.room_number)),
        canSelect:
          !bookedRoomNumbers.has(parseInt(room.room_number)) &&
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

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format" });
    }

    // Step 1: Find overlapping bookings (rooms that are NOT available)
    const overlappingBookings = await Booking.find({
      isActive: true,
      $or: [
        {
          checkInDate: { $lt: checkOut },
          checkOutDate: { $gt: checkIn },
        },
      ],
    });

    // Step 2: Extract roomNumbers from those bookings
    const bookedRoomNumbers = overlappingBookings.map(
      (booking) => booking.roomNumber
    );

    // Step 3: Find rooms not in that list
    const availableRooms = await Room.find({
      room_number: { $nin: bookedRoomNumbers },
    }).populate("category", "name");

    // Step 4: Group by category
    const grouped = {};

    availableRooms.forEach((room) => {
      const catId = room.category?._id?.toString() || "uncategorized";
      const catName = room.category?.name || "Uncategorized";

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
        status: room.status,
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

