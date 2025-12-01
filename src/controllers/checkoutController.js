const Checkout = require('../models/Checkout');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const mongoose = require('mongoose');
const { TAX_CONFIG, calculateTaxableAmount, calculateCGST, calculateSGST } = require('../utils/taxConfig');
const { generateInvoiceNumber } = require('../utils/invoiceNumberGenerator');
const fs = require('fs');
const path = require('path');

// Create checkout record
exports.createCheckout = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Get booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get room service charges from restaurant orders
    let roomServiceCharges = 0;
    try {
      const RestaurantOrder = require('../models/RestaurantOrder');
      
      // Split room numbers and check each one
      const roomNumbers = booking.roomNumber ? booking.roomNumber.split(',').map(r => r.trim()) : [];
      
      const restaurantOrders = await RestaurantOrder.find({
        tableNo: { $in: roomNumbers },
        paymentStatus: { $ne: 'paid' }
      });
      
      roomServiceCharges = restaurantOrders.reduce((total, order) => {
        return total + (order.amount || 0);
      }, 0);
    } catch (error) {
      // Error fetching room service charges
    }

    // Calculate charges
    const restaurantCharges = 0;
    const laundryCharges = 0;
    const inspectionCharges = 0;
    const bookingCharges = Number(booking.rate) || 0;
    const totalAmount = bookingCharges + roomServiceCharges;

    // Check if checkout already exists for this booking
    let checkout = await Checkout.findOne({ bookingId });
    
    if (checkout) {
      // Update existing checkout with new room service charges
      checkout.roomServiceCharges = roomServiceCharges;
      checkout.totalAmount = checkout.bookingCharges + roomServiceCharges;
      checkout.pendingAmount = checkout.totalAmount;
      await checkout.save();
    } else {
      // Create new checkout
      checkout = await Checkout.create({
        bookingId,
        restaurantCharges,
        laundryCharges,
        inspectionCharges,
        roomServiceCharges,
        bookingCharges,
        totalAmount,
        serviceItems: {
          restaurant: [],
          laundry: [],
          inspection: []
        },
        pendingAmount: totalAmount
      });
    }

    res.status(201).json({ success: true, checkout });
  } catch (error) {
    // CreateCheckout Error
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

    res.status(200).json({ success: true, checkout });
  } catch (error) {
    // GetCheckout Error
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

    res.status(200).json({ success: true, checkout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paidAmount } = req.body;

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
      
      // Update booking status to 'Checked Out'
      booking.status = 'Checked Out';
      booking.paymentStatus = 'Paid';
      await booking.save();
      
      // Handle multiple room numbers (comma-separated)
      if (booking.roomNumber && booking.roomNumber.trim()) {
        const roomNumbers = booking.roomNumber.split(',').map(num => num.trim()).filter(num => num);
        
        for (const roomNum of roomNumbers) {
          try {
            const room = await Room.findOne({ room_number: roomNum });
            if (room) {
              room.status = 'available';
              await room.save();
              // Room set to available
            } else {
              // Room not found
            }
          } catch (roomError) {
            // Error updating room
          }
        }
      }
    }

    await checkout.save();
    res.status(200).json({ success: true, checkout });
  } catch (error) {
    // UpdatePayment Error
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
      const booking = checkout.bookingId;
      
      // Split room numbers and check each one
      const roomNumbers = booking.roomNumber ? booking.roomNumber.split(',').map(r => r.trim()) : [];
      
      // Use unpaid orders for calculation
      const restaurantOrders = await RestaurantOrder.find({
        tableNo: { $in: roomNumbers },
        paymentStatus: { $ne: 'paid' }
      });
      
      // Also check RoomService model for room service orders
      const RoomService = require('../models/RoomService');
      const roomServiceOrders = await RoomService.find({
        roomNumber: { $in: roomNumbers },
        paymentStatus: { $ne: 'paid' }
      });
      
      const restaurantCharges = restaurantOrders.reduce((total, order) => {
        return total + (order.amount || 0);
      }, 0);
      
      const roomServiceCharges = roomServiceOrders.reduce((total, order) => {
        return total + (order.totalAmount || 0);
      }, 0);
      
      const calculatedRoomServiceCharges = restaurantCharges + roomServiceCharges;
      
      // Always update checkout with latest calculated charges
      if (calculatedRoomServiceCharges !== checkout.roomServiceCharges) {
        checkout.roomServiceCharges = calculatedRoomServiceCharges;
        checkout.totalAmount = checkout.bookingCharges + calculatedRoomServiceCharges;
        await checkout.save();
      }
      
      // Update the in-memory object
      checkout.roomServiceCharges = calculatedRoomServiceCharges;
    } catch (error) {
      // Error recalculating room service charges
    }

    const booking = checkout.bookingId;
    const currentDate = new Date();
    const billNo = await generateInvoiceNumber();
    
    // Use booking's actual GST rates
    const bookingCgstRate = booking?.cgstRate || 0;
    const bookingSgstRate = booking?.sgstRate || 0;
    
    // Calculate total taxable amount including room service charges
    const bookingTaxableAmount = booking?.taxableAmount || checkout.bookingCharges;
    const roomServiceAmount = checkout.roomServiceCharges || 0;
    const totalTaxableAmount = bookingTaxableAmount + roomServiceAmount;
    

    
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
        
        // Add room service charges as line items - force add if checkout has room service charges
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

    res.status(200).json({ success: true, invoice });
  } catch (error) {
    // GetInvoice Error
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
    // GetTaxConfig Error
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
    // UpdateTaxConfig Error
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};