const Checkout = require('../models/Checkout');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const { TAX_CONFIG } = require('../utils/taxConfig');
const Invoice = require('../models/Invoice');

// Create checkout record
exports.createCheckout = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Get booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get restaurant charges and room service charges separately
    let restaurantCharges = 0;
    let roomServiceCharges = 0;
    
    try {
      const RestaurantOrder = require('../models/RestaurantOrder');
      const RoomService = require('../models/RoomService');
      
      // Split room numbers and check each one
      const roomNumbers = booking.roomNumber ? booking.roomNumber.split(',').map(r => r.trim()) : [];
      
      // Get restaurant orders for this booking (exclude cancelled, completed, and non-chargeable orders)
      const restaurantOrders = await RestaurantOrder.find({
        bookingId: bookingId,
        paymentStatus: { $ne: 'paid' },
        status: { $nin: ['cancelled', 'canceled', 'completed'] },
        nonChargeable: { $ne: true }
      });
      
      restaurantCharges = restaurantOrders.reduce((total, order) => {
        return total + (order.amount || 0);
      }, 0);
      
      // Get room service orders for this booking (exclude cancelled, completed, and non-chargeable orders)
      const roomServiceOrders = await RoomService.find({
        bookingId: bookingId,
        paymentStatus: { $ne: 'paid' },
        status: { $nin: ['cancelled', 'canceled', 'completed'] },
        nonChargeable: { $ne: true }
      });
      
      roomServiceCharges = roomServiceOrders.reduce((total, order) => {
        return total + (order.totalAmount || 0);
      }, 0);
    } catch (error) {
      console.error('Error fetching charges:', error);
    }

    // Calculate charges
    const laundryCharges = 0;
    const bookingCharges = Number(booking.rate) || 0;
    const totalAmount = bookingCharges + restaurantCharges + roomServiceCharges;

    // Check if checkout already exists for this booking
    let checkout = await Checkout.findOne({ bookingId });
    
    if (checkout) {
      // Update existing checkout with new charges
      checkout.restaurantCharges = restaurantCharges;
      checkout.roomServiceCharges = roomServiceCharges;
      checkout.totalAmount = checkout.bookingCharges + restaurantCharges + roomServiceCharges;
      checkout.pendingAmount = checkout.totalAmount;
      await checkout.save();
    } else {
      // Create new checkout
      checkout = await Checkout.create({
        bookingId,
        restaurantCharges,
        laundryCharges,
        roomServiceCharges,
        bookingCharges,
        totalAmount,
        pendingAmount: totalAmount
      });
    }

    res.status(201).json({ success: true, checkout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get checkout by booking ID
exports.getCheckout = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const checkout = await Checkout.findOne({ bookingId })
      .populate('bookingId', 'grcNo name roomNumber checkInDate checkOutDate');
    
    if (!checkout) {
      return res.status(404).json({ message: 'Checkout not found' });
    }

    // Recalculate charges to ensure current data
    const booking = checkout.bookingId;
    const roomNumbers = booking.roomNumber ? booking.roomNumber.split(',').map(r => r.trim()) : [];
    
    try {
      const RestaurantOrder = require('../models/RestaurantOrder');
      const RoomService = require('../models/RoomService');
      
      const restaurantOrders = await RestaurantOrder.find({
        $or: [
          { tableNo: { $in: roomNumbers } },
          { bookingId: bookingId }
        ],
        paymentStatus: { $ne: 'paid' },
        status: { $nin: ['cancelled', 'canceled'] },
        nonChargeable: { $ne: true }
      });
      
      const roomServiceOrders = await RoomService.find({
        roomNumber: { $in: roomNumbers },
        paymentStatus: { $ne: 'paid' },
        status: { $nin: ['cancelled', 'canceled'] },
        nonChargeable: { $ne: true }
      });
      
      const restaurantCharges = restaurantOrders.reduce((total, order) => total + (order.amount || 0), 0);
      const roomServiceCharges = roomServiceOrders.reduce((total, order) => total + (order.totalAmount || 0), 0);
      
      // Update checkout if charges have changed
      if (restaurantCharges !== checkout.restaurantCharges || roomServiceCharges !== checkout.roomServiceCharges) {
        checkout.restaurantCharges = restaurantCharges;
        checkout.roomServiceCharges = roomServiceCharges;
        checkout.totalAmount = checkout.bookingCharges + restaurantCharges + roomServiceCharges;
        checkout.pendingAmount = checkout.totalAmount;
        await checkout.save();
      }
    } catch (error) {
      console.error('Error recalculating charges:', error);
    }

    res.status(200).json({ success: true, checkout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get checkout by booking ID (alternative endpoint)
exports.getCheckoutByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const checkout = await Checkout.findOne({ bookingId })
      .populate('bookingId', 'grcNo name roomNumber checkInDate checkOutDate');
    
    if (!checkout) {
      return res.status(404).json({ message: 'Checkout not found' });
    }

    // Recalculate charges to ensure current data
    const booking = checkout.bookingId;
    const roomNumbers = booking.roomNumber ? booking.roomNumber.split(',').map(r => r.trim()) : [];
    
    try {
      const RestaurantOrder = require('../models/RestaurantOrder');
      const RoomService = require('../models/RoomService');
      
      const restaurantOrders = await RestaurantOrder.find({
        $or: [
          { tableNo: { $in: roomNumbers } },
          { bookingId: bookingId }
        ],
        paymentStatus: { $ne: 'paid' },
        status: { $nin: ['cancelled', 'canceled'] },
        nonChargeable: { $ne: true }
      });
      
      const roomServiceOrders = await RoomService.find({
        roomNumber: { $in: roomNumbers },
        paymentStatus: { $ne: 'paid' },
        status: { $nin: ['cancelled', 'canceled'] },
        nonChargeable: { $ne: true }
      });
      
      const restaurantCharges = restaurantOrders.reduce((total, order) => total + (order.amount || 0), 0);
      const roomServiceCharges = roomServiceOrders.reduce((total, order) => total + (order.totalAmount || 0), 0);
      
      // Update checkout if charges have changed
      if (restaurantCharges !== checkout.restaurantCharges || roomServiceCharges !== checkout.roomServiceCharges) {
        checkout.restaurantCharges = restaurantCharges;
        checkout.roomServiceCharges = roomServiceCharges;
        checkout.totalAmount = checkout.bookingCharges + restaurantCharges + roomServiceCharges;
        checkout.pendingAmount = checkout.totalAmount;
        await checkout.save();
      }
    } catch (error) {
      console.error('Error recalculating charges:', error);
    }

    res.status(200).json({ success: true, checkout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paidAmount, lateCheckoutFee } = req.body;

    const checkout = await Checkout.findById(id).populate('bookingId');
    if (!checkout) {
      return res.status(404).json({ message: 'Checkout not found' });
    }

    checkout.status = status;
    if (paidAmount !== undefined) {
      checkout.pendingAmount = Math.max(0, checkout.totalAmount - paidAmount);
    }

    // If payment is completed, update booking status and room availability
    if ((status === 'Completed' || status === 'paid') && checkout.bookingId) {
      const booking = checkout.bookingId;
      
      // Update booking status to 'Checked Out' and set actual checkout time
      booking.status = 'Checked Out';
      booking.paymentStatus = 'Paid';
      booking.actualCheckOutTime = new Date(); // This triggers late checkout fine calculation
      
      // Apply custom late checkout fee if provided
      if (lateCheckoutFee && lateCheckoutFee > 0) {
        booking.lateCheckoutFine.amount = lateCheckoutFee;
        booking.lateCheckoutFine.applied = true;
        booking.lateCheckoutFine.appliedAt = new Date();
      }
      
      await booking.save();
      
      // Handle multiple room numbers (comma-separated)
      if (booking.roomNumber && booking.roomNumber.trim()) {
        const roomNumbers = booking.roomNumber.split(',').map(num => num.trim()).filter(num => num);
        
        // Update room service orders to paid and completed
        try {
          const RoomService = require('../models/RoomService');
          await RoomService.updateMany(
            { 
              roomNumber: { $in: roomNumbers },
              paymentStatus: { $ne: 'paid' },
              status: { $ne: 'cancelled' }
            },
            { 
              paymentStatus: 'paid',
              status: 'completed'
            }
          );
          
          // Also update restaurant orders
          const RestaurantOrder = require('../models/RestaurantOrder');
          await RestaurantOrder.updateMany(
            {
              tableNo: { $in: roomNumbers },
              paymentStatus: { $ne: 'paid' },
              status: { $ne: 'cancelled' },
              nonChargeable: { $ne: true }
            },
            {
              paymentStatus: 'paid',
              status: 'completed'
            }
          );
        } catch (serviceError) {
          console.error('Error updating service orders:', serviceError);
        }
        
        for (const roomNum of roomNumbers) {
          try {
            const room = await Room.findOne({ room_number: roomNum });
            if (room) {
              room.status = 'available';
              await room.save();
            }
          } catch (roomError) {
            console.error('Error updating room:', roomError);
          }
        }
      }
    }

    await checkout.save();
    res.status(200).json({ success: true, checkout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate and save invoice
exports.generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkout = await Checkout.findById(id)
      .populate({
        path: 'bookingId',
        select: 'grcNo name roomNumber checkInDate checkOutDate mobileNo address city rate taxableAmount cgstAmount sgstAmount cgstRate sgstRate noOfAdults noOfChildren extraBed extraBedCharge extraBedRooms roomRates days',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      });
    
    if (!checkout) {
      return res.status(404).json({ message: 'Checkout not found' });
    }
    

    
    res.status(200).json({ 
      success: true, 
      message: 'Invoice generated successfully',
      invoiceNumber: checkout.invoiceNumber,
      checkoutId: checkout._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get invoice by checkout ID
exports.getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    

    const checkout = await Checkout.findById(id)
      .populate({
        path: 'bookingId',
        select: 'grcNo name roomNumber checkInDate checkOutDate mobileNo address city rate taxableAmount cgstAmount sgstAmount cgstRate sgstRate noOfAdults noOfChildren extraBed extraBedCharge extraBedRooms roomRates days',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      });
    
    if (!checkout) {
      return res.status(404).json({ message: 'Checkout not found' });
    }
    // Always recalculate room service charges to get latest orders
    try {
      const RestaurantOrder = require('../models/RestaurantOrder');
      const RoomService = require('../models/RoomService');
      const booking = checkout.bookingId;
      
      // Split room numbers and check each one
      const roomNumbers = booking.roomNumber ? booking.roomNumber.split(',').map(r => r.trim()) : [];
      
      // Get orders for this specific booking only (exclude non-chargeable)
      const restaurantOrders = await RestaurantOrder.find({
        bookingId: booking._id,
        status: { $nin: ['cancelled', 'canceled'] },
        nonChargeable: { $ne: true }
      });
      
      // Also check RoomService model for room service orders (exclude non-chargeable)
      const roomServiceOrders = await RoomService.find({
        bookingId: booking._id,
        status: { $nin: ['cancelled', 'canceled'] },
        nonChargeable: { $ne: true }
      });
      
      const restaurantCharges = restaurantOrders.reduce((total, order) => {
        return total + (order.amount || 0);
      }, 0);
      
      const roomServiceCharges = roomServiceOrders.reduce((total, order) => {
        return total + (order.totalAmount || 0);
      }, 0);
      
      // Always update checkout with latest calculated charges
      checkout.restaurantCharges = restaurantCharges;
      checkout.roomServiceCharges = roomServiceCharges;
      checkout.totalAmount = checkout.bookingCharges + restaurantCharges + roomServiceCharges;
      
      // Save updated charges to database
      await checkout.save();
    } catch (error) {
      console.error('Error recalculating charges:', error);
    }

    const booking = checkout.bookingId;
    const currentDate = new Date();
    
    // Use GRC number as bill number
    const billNo = booking?.grcNo || 'N/A';
    
    // Save invoice record if not already exists
    try {
      await Invoice.findOneAndUpdate(
        { bookingId: booking._id },
        { bookingId: booking._id, createdAt: currentDate },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error saving invoice record:', error);
    }
    
    // Use booking's actual GST rates
    const bookingCgstRate = booking?.cgstRate || 0;
    const bookingSgstRate = booking?.sgstRate || 0;
    
    // Calculate total taxable amount including restaurant and room service charges
    const bookingTaxableAmount = booking?.taxableAmount || checkout.bookingCharges;
    const restaurantAmount = checkout.restaurantCharges || 0;
    const roomServiceAmount = checkout.roomServiceCharges || 0;
    const totalTaxableAmount = bookingTaxableAmount + restaurantAmount + roomServiceAmount;
    
    const cgstAmount = booking?.cgstAmount || (totalTaxableAmount * bookingCgstRate);
    const sgstAmount = booking?.sgstAmount || (totalTaxableAmount * bookingSgstRate);
    
    const invoice = {
      invoiceDetails: {
        billNo: billNo,
        billDate: currentDate.toLocaleDateString('en-GB'),
        grcNo: booking?.grcNo || 'N/A',
        roomNo: booking?.roomNumber || 'N/A',
        roomType: booking?.categoryId?.name || 'DELUXE ROOM',
        pax: (booking?.noOfAdults || 0) + (booking?.noOfChildren || 0),
        adult: booking?.noOfAdults || 2,
        checkInDate: booking?.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('en-GB') : 'N/A',
        checkOutDate: booking?.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString('en-GB') : 'N/A'
      },
      clientDetails: {
        name: booking?.name || 'N/A',
        address: booking?.address || 'GORAKHPUR, UP-273001',
        city: booking?.city || 'GORAKHPUR',
        company: ':',
        gstin: '09COJPP9995B1Z3',
        mobileNo: booking?.mobileNo || 'N/A',
        nationality: 'Indian'
      },
      items: (() => {
        const items = [];
        
        // Calculate room rent without extra bed charges
        const roomRentAmount = (booking?.roomRates || []).reduce((sum, room) => {
          return sum + (room.customRate || 0);
        }, 0) * (booking?.days || 1);
        
        // Add room rent item
        items.push({
          date: booking?.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('en-GB') : currentDate.toLocaleDateString('en-GB'),
          particulars: `Room Rent ${booking?.categoryId?.name || 'DELUXE ROOM'} (Room: ${booking?.roomNumber || 'N/A'})`,
          pax: booking?.noOfAdults || 2,
          declaredRate: roomRentAmount,
          hsn: 996311,
          rate: (bookingCgstRate + bookingSgstRate) * 100,
          cgstRate: roomRentAmount * bookingCgstRate,
          sgstRate: roomRentAmount * bookingSgstRate,
          amount: roomRentAmount
        });
        
        // Add restaurant charges as line items
        const restaurantAmount = checkout.restaurantCharges || 0;
        if (restaurantAmount > 0) {
          items.push({
            date: booking?.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('en-GB') : currentDate.toLocaleDateString('en-GB'),
            particulars: `IN ROOM DINING`,
            pax: 1,
            declaredRate: restaurantAmount,
            hsn: 996311,
            rate: (bookingCgstRate + bookingSgstRate) * 100,
            cgstRate: restaurantAmount * bookingCgstRate,
            sgstRate: restaurantAmount * bookingSgstRate,
            amount: restaurantAmount
          });
        }
        
        // Add room service charges as line items
        const roomServiceAmount = checkout.roomServiceCharges || 0;
        if (roomServiceAmount > 0) {
          items.push({
            date: booking?.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('en-GB') : currentDate.toLocaleDateString('en-GB'),
            particulars: `Room Service Charges`,
            pax: 1,
            declaredRate: roomServiceAmount,
            hsn: 996311,
            rate: (bookingCgstRate + bookingSgstRate) * 100,
            cgstRate: roomServiceAmount * bookingCgstRate,
            sgstRate: roomServiceAmount * bookingSgstRate,
            amount: roomServiceAmount
          });
        }
        
        // Add individual extra bed charges for each room
        if (booking?.extraBedRooms && booking.extraBedRooms.length > 0) {
          booking.extraBedRooms.forEach(roomNumber => {
            const roomRate = booking.roomRates?.find(r => r.roomNumber == roomNumber);
            let extraBedDays = booking?.days || 1;
            
            // Calculate actual extra bed days if start date is specified
            if (roomRate?.extraBedStartDate && booking?.checkOutDate) {
              const startDate = new Date(roomRate.extraBedStartDate);
              const endDate = new Date(booking.checkOutDate);
              if (startDate < endDate) {
                extraBedDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
              } else {
                extraBedDays = 0;
              }
            }
            
            const extraBedAmount = (booking?.extraBedCharge || 0) * extraBedDays;
            
            if (extraBedAmount > 0) {
              items.push({
                date: booking?.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('en-GB') : currentDate.toLocaleDateString('en-GB'),
                particulars: `Extra Bed Charge - Room ${roomNumber} (${extraBedDays} days × ₹${booking?.extraBedCharge || 0})`,
                pax: 1,
                declaredRate: extraBedAmount,
                hsn: 996311,
                rate: (bookingCgstRate + bookingSgstRate) * 100,
                cgstRate: extraBedAmount * bookingCgstRate,
                sgstRate: extraBedAmount * bookingSgstRate,
                amount: extraBedAmount
              });
            }
          });
        }
        
        return items;
      })(),
      taxes: [
        {
          taxRate: (bookingCgstRate + bookingSgstRate) * 100,
          taxableAmount: totalTaxableAmount,
          cgst: cgstAmount,
          sgst: sgstAmount,
          amount: totalTaxableAmount
        }
      ],
      payment: {
        taxableAmount: totalTaxableAmount,
        cgst: cgstAmount,
        sgst: sgstAmount,
        total: totalTaxableAmount + cgstAmount + sgstAmount
      },
      otherCharges: []
    };

    if (checkout.restaurantCharges > 0) {
      invoice.otherCharges.push({
        particulars: 'IN ROOM DINING',
        amount: checkout.restaurantCharges
      });
    }

    // Room service charges are already included as line items, no need to add to other charges

    if (checkout.laundryCharges > 0) {
      invoice.otherCharges.push({
        particulars: 'LAUNDRY',
        amount: checkout.laundryCharges
      });
    }

    if (checkout.inspectionCharges > 0) {
      invoice.otherCharges.push({
        particulars: 'ROOM INSPECTION CHARGES',
        amount: checkout.inspectionCharges
      });
    }

    // Add late checkout fee if applied
    if (booking?.lateCheckoutFine?.applied && booking.lateCheckoutFine.amount > 0 && !booking.lateCheckoutFine.waived) {
      invoice.otherCharges.push({
        particulars: 'LATE CHECKOUT FEE',
        amount: booking.lateCheckoutFine.amount
      });
    }

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get tax configuration
exports.getTaxConfig = async (req, res) => {
  try {
    const taxConfig = {
      cgst: TAX_CONFIG.CGST_RATE * 100,
      sgst: TAX_CONFIG.SGST_RATE * 100,
      total: TAX_CONFIG.TOTAL_TAX_RATE * 100
    };
    res.status(200).json({ success: true, taxConfig });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Update tax configuration
exports.updateTaxConfig = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is required' });
    }
    
    const { cgstRate, sgstRate } = req.body;
    
    if (cgstRate !== undefined) TAX_CONFIG.CGST_RATE = cgstRate / 100;
    if (sgstRate !== undefined) TAX_CONFIG.SGST_RATE = sgstRate / 100;
    
    TAX_CONFIG.TOTAL_TAX_RATE = TAX_CONFIG.CGST_RATE + TAX_CONFIG.SGST_RATE;
    
    const updatedConfig = {
      cgst: TAX_CONFIG.CGST_RATE * 100,
      sgst: TAX_CONFIG.SGST_RATE * 100,
      total: TAX_CONFIG.TOTAL_TAX_RATE * 100
    };
    
    res.status(200).json({ 
      success: true, 
      message: 'Tax configuration updated successfully',
      taxConfig: updatedConfig 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};