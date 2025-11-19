const Booking = require("../models/Booking.js");
const Category = require("../models/Category.js");
const Room = require("../models/Room.js");
const mongoose = require('mongoose');

// 🔹 Generate unique GRC number
const generateGRC = async () => {
  let grcNo, exists = true;
  while (exists) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    grcNo = `GRC-${rand}`;
    exists = await Booking.findOne({ grcNo });
  }
  return grcNo;
};

// Book a room for a category (single or multiple)
exports.bookRoom = async (req, res) => {
  try {
    const handleBooking = async (categoryId, count, extraDetails = {}) => {
      const category = await Category.findById(categoryId);
      if (!category) throw new Error(`Category not found: ${categoryId}`);

      const availableRooms = await Room.find({ categoryId: categoryId, status: 'available' }).limit(count);
      if (availableRooms.length < count) {
        throw new Error(`Not enough available rooms in ${category.name}`);
      }

      const bookedRoomNumbers = [];
      for (let i = 0; i < availableRooms.length; i++) {
        const room = availableRooms[i];
       // const referenceNumber = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
        const grcNo = await generateGRC();

        // Create booking document according to updated flat schema
        const booking = new Booking({
          grcNo,
          categoryId,
          bookingDate: extraDetails.bookingDate || new Date(),
          numberOfRooms: 1,
          isActive: true,
          checkInDate: extraDetails.checkInDate,
          checkOutDate: extraDetails.checkOutDate,
          days: extraDetails.days,
          timeIn: extraDetails.timeIn,
          timeOut: extraDetails.timeOut,

          salutation: extraDetails.salutation,
          name: extraDetails.name,
          age: extraDetails.age,
          gender: extraDetails.gender,
          address: extraDetails.address,
          city: extraDetails.city,
          nationality: extraDetails.nationality,
          mobileNo: extraDetails.mobileNo,
          email: extraDetails.email,
          phoneNo: extraDetails.phoneNo,
          birthDate: extraDetails.birthDate,
          anniversary: extraDetails.anniversary,

          companyName: extraDetails.companyName,
          companyGSTIN: extraDetails.companyGSTIN,

          idProofType: extraDetails.idProofType,
          idProofNumber: extraDetails.idProofNumber,
          idProofImageUrl: extraDetails.idProofImageUrl,
          idProofImageUrl2: extraDetails.idProofImageUrl2,
          photoUrl: extraDetails.photoUrl,

          roomNumber: room.room_number,
          planPackage: extraDetails.planPackage,
          noOfAdults: extraDetails.noOfAdults,
          noOfChildren: extraDetails.noOfChildren,
          rate: extraDetails.rate,
          taxIncluded: extraDetails.taxIncluded,
          serviceCharge: extraDetails.serviceCharge,

          arrivedFrom: extraDetails.arrivedFrom,
          destination: extraDetails.destination,
          remark: extraDetails.remark,
          businessSource: extraDetails.businessSource,
          marketSegment: extraDetails.marketSegment,
          purposeOfVisit: extraDetails.purposeOfVisit,

          discountPercent: extraDetails.discountPercent,
          discountRoomSource: extraDetails.discountRoomSource,

          paymentMode: extraDetails.paymentMode,
          paymentStatus: extraDetails.paymentStatus || 'Pending',

          bookingRefNo: extraDetails.bookingRefNo,

          mgmtBlock: extraDetails.mgmtBlock,
          billingInstruction: extraDetails.billingInstruction,

          temperature: extraDetails.temperature,

          fromCSV: extraDetails.fromCSV,
          epabx: extraDetails.epabx,
          vip: extraDetails.vip || false,

          status: extraDetails.status || 'Booked',
          categoryId: category._id
        });

        await booking.save();

        // Set Room.status to 'booked'
        room.status = 'booked';
        await room.save();
        bookedRoomNumbers.push(room.room_number);
      }

      const bookings = await Booking.find({
        roomNumber: { $in: bookedRoomNumbers },
        categoryId
      });

      return bookings;
    };

    // 🔹 Multiple Bookings
    if (Array.isArray(req.body.bookings)) {
      const results = [];
      for (const item of req.body.bookings) {
        const { categoryId, count, ...extraDetails } = item;
        const bookings = await handleBooking(categoryId, count, extraDetails);
        results.push(...bookings);
      }
      return res.status(201).json({ success: true, booked: results });
    }

    // 🔹 Single Booking
    const {
      categoryId,
      count,
      ...extraDetails
    } = req.body;

    if (!categoryId) return res.status(400).json({ error: 'categoryId is required' });

    const numRooms = count && Number.isInteger(count) && count > 0 ? count : 1;

    const bookings = await handleBooking(categoryId, numRooms, extraDetails);

    return res.status(201).json({ success: true, booked: bookings });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 🔹 Get all bookings
exports.getBookings = async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const bookings = await Booking.find(filter).populate('categoryId');

    // Map bookings to ensure safe access to category properties
    const safeBookings = bookings.map(booking => {
      const bookingObj = booking.toObject();
      if (!bookingObj.categoryId) {
        bookingObj.categoryId = { name: 'Unknown' };
      }
      return bookingObj;
    });

    res.json(safeBookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Get bookings by category

exports.getBookingsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log("Received categoryId:", categoryId);

    // Convert categoryId param to ObjectId
    const mongooseCategoryId = new mongoose.Types.ObjectId(categoryId);

    // Query bookings for that categoryId
    const bookings = await Booking.find({ categoryId: mongooseCategoryId }).populate('categoryId');

    res.json(bookings);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Checkout booking (enhanced process)
exports.checkoutBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.status !== 'Checked In') {
      return res.status(400).json({ error: 'Only checked-in bookings can be checked out' });
    }

    // Update booking status to 'Checked Out'
    booking.status = 'Checked Out';
    await booking.save();

    // Find the room associated with this booking
    let room = await Room.findOne({ room_number: String(booking.roomNumber) });

    if (!room && booking.categoryId) {
      room = await Room.findOne({
        categoryId: booking.categoryId,
        room_number: String(booking.roomNumber)
      });
    }

    if (!room) {
      room = await Room.findOne({ room_number: booking.roomNumber });
    }

    if (room) {
      // Set Room.status to 'available' when checking out
      room.status = 'available';
      await room.save();
    }

    res.json({
      success: true,
      message: 'Checkout completed. Room is now available.',
      booking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Unbook (soft delete)
exports.deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Even if booking is already inactive, proceed with room status update
    if (!booking.isActive) {
      console.log('Note: Booking was already inactive, proceeding with room status update');
    } else {
      booking.isActive = false;
      await booking.save();
    }

    // Find the room associated with this booking
    let room = await Room.findOne({ room_number: String(booking.roomNumber) });

    if (!room && booking.categoryId) {
      room = await Room.findOne({
        categoryId: booking.categoryId,
        room_number: String(booking.roomNumber)
      });
    }

    if (!room) {
      room = await Room.findOne({ room_number: booking.roomNumber });
    }

    if (room) {
      // Set Room.status to 'available' when unbooking
      room.status = 'available';
      await room.save();
    }

    res.json({
      success: true,
      message: 'Booking cancelled. Room is now available.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔹 PERMANENT DELETE
exports.permanentlyDeleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const deleted = await Booking.findByIdAndDelete(bookingId);
    if (!deleted) return res.status(404).json({ error: 'Booking not found' });

    res.json({ success: true, message: 'Booking permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Update booking
exports.updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updates = req.body;

    // Fields that cannot be updated directly
    const restrictedFields = ['isActive', 'bookingRefNo', 'createdAt', '_id', 'grcNo'];
    restrictedFields.forEach(field => delete updates[field]);

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Update allowed simple fields directly on booking document
    const simpleFields = [
      'salutation', 'name', 'age', 'gender', 'address', 'city', 'nationality',
      'mobileNo', 'email', 'phoneNo', 'birthDate', 'anniversary',

      'companyName', 'companyGSTIN',

      'idProofType', 'idProofNumber', 'idProofImageUrl', 'idProofImageUrl2', 'photoUrl',

      'roomNumber', 'planPackage', 'noOfAdults', 'noOfChildren', 'rate', 'taxIncluded', 'serviceCharge',

      'arrivedFrom', 'destination', 'remark', 'businessSource', 'marketSegment', 'purposeOfVisit',

      'discountPercent', 'discountRoomSource',

      'paymentMode', 'paymentStatus',

      'bookingRefNo', 'mgmtBlock', 'billingInstruction',

      'temperature', 'fromCSV', 'epabx', 'vip',

      'status', 'categoryId',

      'bookingDate', 'numberOfRooms', 'checkInDate', 'checkOutDate', 'days', 'timeIn', 'timeOut'
    ];

    simpleFields.forEach(field => {
      if (typeof updates[field] !== 'undefined') {
        booking[field] = updates[field];
      }
    });

    // Extension History (for updates related to extension)
    if (updates.extendedCheckOut) {
      const originalCheckIn = booking.checkInDate;
      const originalCheckOut = booking.checkOutDate;

      booking.extensionHistory.push({
        originalCheckIn,
        originalCheckOut,
        extendedCheckOut: new Date(updates.extendedCheckOut),
        reason: updates.reason,
        additionalAmount: updates.additionalAmount,
        paymentMode: updates.paymentMode,
        approvedBy: updates.approvedBy
      });

      booking.checkOutDate = new Date(updates.extendedCheckOut);

      if (updates.additionalAmount) {
        booking.rate = (booking.rate || 0) + updates.additionalAmount;
      }
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔹 Extend booking stay
exports.extendBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { extendedCheckOut, reason, additionalAmount, paymentMode, approvedBy } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (!booking.isActive) {
      return res.status(400).json({ error: 'Cannot extend inactive booking' });
    }

    const originalCheckIn = booking.checkInDate;
    const originalCheckOut = booking.checkOutDate;

    // Add to extension history
    booking.extensionHistory.push({
      originalCheckIn,
      originalCheckOut,
      extendedCheckOut: new Date(extendedCheckOut),
      reason,
      additionalAmount,
      paymentMode,
      approvedBy
    });

    // Update checkout date
    booking.checkOutDate = new Date(extendedCheckOut);

    // Update rate if additionalAmount provided
    if (additionalAmount) {
      booking.rate = (booking.rate || 0) + additionalAmount;
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking extended successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get booking by GRC Number
exports.getBookingByGRC = async (req, res) => {
  try {
    const { grcNo } = req.params;

    const booking = await Booking.findOne({ grcNo }).populate('categoryId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found with given GRC' });
    }

    const result = booking.toObject();
    if (!result.categoryId) {
      result.categoryId = { name: 'Unknown' };
    }

    res.json({ success: true, booking: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDetailsByGrc = async (req, res) => {
  try {
    const { grcNo } = req.params;

    const record = await Booking.findOne({ grcNo });

    if (!record) {
      return res.status(404).json({ message: "No booking found for this GRC" });
    }

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get booking by Booking ID
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate('categoryId');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const result = booking.toObject();
    if (!result.categoryId) {
      result.categoryId = { name: 'Unknown' };
    }

    res.json({ success: true, booking: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get booking history with invoices
exports.getBookingHistory = async (req, res) => {
  try {
    const Invoice = require('../models/Invoice');
    
    const bookings = await Booking.find({
      status: { $in: ['Booked', 'Checked In', 'Checked Out'] }
    }).populate('categoryId').sort({ createdAt: -1 });

    const bookingHistory = await Promise.all(
      bookings.map(async (booking) => {
        const invoices = await Invoice.find({ bookingId: booking._id });
        return {
          ...booking.toObject(),
          invoices
        };
      })
    );

    res.json({ success: true, bookings: bookingHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
