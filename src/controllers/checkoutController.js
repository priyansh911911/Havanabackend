const Checkout = require('../models/Checkout');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const { TAX_CONFIG, calculateTaxableAmount, calculateCGST, calculateSGST } = require('../utils/taxConfig');

// Create checkout record
exports.createCheckout = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Get booking details
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Calculate charges
    const restaurantCharges = 0;
    const laundryCharges = 0;
    const inspectionCharges = 0;
    const bookingCharges = Number(booking.rate) || 0;
    const totalAmount = bookingCharges;

    const checkout = await Checkout.create({
      bookingId,
      restaurantCharges,
      laundryCharges,
      inspectionCharges,
      bookingCharges,
      totalAmount,
      serviceItems: {
        restaurant: [],
        laundry: [],
        inspection: []
      },
      pendingAmount: totalAmount
    });

    res.status(201).json({ success: true, checkout });
  } catch (error) {
    console.error('CreateCheckout Error:', error);
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
    console.error('GetCheckout Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paidAmount } = req.body;

    const checkout = await Checkout.findById(id);
    if (!checkout) {
      return res.status(404).json({ message: 'Checkout not found' });
    }

    checkout.status = status;
    if (paidAmount !== undefined) {
      checkout.pendingAmount = Math.max(0, checkout.totalAmount - paidAmount);
    }

    await checkout.save();
    res.status(200).json({ success: true, checkout });
  } catch (error) {
    console.error('UpdatePayment Error:', error);
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
        select: 'grcNo name roomNumber checkInDate checkOutDate mobileNo address city rate',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      });
    
    if (!checkout) {
      return res.status(404).json({ message: 'Checkout not found' });
    }

    const booking = checkout.bookingId;
    const currentDate = new Date();
    const billNo = `P${Date.now().toString().slice(-10)}`;
    
    const taxableAmount = calculateTaxableAmount(checkout.bookingCharges);
    const cgstAmount = calculateCGST(taxableAmount);
    const sgstAmount = calculateSGST(taxableAmount);
    
    const invoice = {
      invoiceDetails: {
        billNo: billNo,
        billDate: currentDate.toLocaleDateString('en-GB'),
        grcNo: booking?.grcNo || 'N/A',
        roomNo: booking?.roomNumber || 'N/A',
        roomType: booking?.categoryId?.name || 'DELUXE ROOM',
        pax: 2,
        adult: 2,
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
      items: [
        {
          date: booking?.checkInDate ? new Date(booking.checkInDate).toLocaleDateString('en-GB') : currentDate.toLocaleDateString('en-GB'),
          particulars: `Room Rent ${booking?.categoryId?.name || 'DELUXE ROOM'} (Room: ${booking?.roomNumber || 'N/A'})`,
          pax: 2,
          declaredRate: checkout.bookingCharges,
          hsn: 996311,
          rate: TAX_CONFIG.DISPLAY_RATE,
          cgstRate: cgstAmount,
          sgstRate: sgstAmount,
          amount: checkout.bookingCharges
        }
      ],
      taxes: [
        {
          taxRate: TAX_CONFIG.DISPLAY_RATE,
          taxableAmount: taxableAmount,
          cgst: cgstAmount,
          sgst: sgstAmount,
          amount: checkout.bookingCharges
        }
      ],
      payment: {
        taxableAmount: taxableAmount,
        cgst: cgstAmount,
        sgst: sgstAmount,
        total: checkout.totalAmount
      },
      otherCharges: []
    };

    if (checkout.restaurantCharges > 0) {
      invoice.otherCharges.push({
        particulars: 'IN ROOM DINING',
        amount: checkout.restaurantCharges
      });
    }

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
    console.error('GetInvoice Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};