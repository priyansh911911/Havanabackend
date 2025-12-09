const Laundry = require('../models/Laundry');
const LaundryItem = require('../models/LaundryItem');
const LaundryLoss = require('../models/LaundryLoss');
const LaundryVendor = require('../models/LaundryVendor');
const mongoose = require('mongoose');

// Create Order
exports.createLaundryOrder = async (req, res) => {
  try {
    const order = await Laundry.create(req.body);
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Orders
exports.getAllLaundryOrders = async (req, res) => {
  try {
    const orders = await Laundry.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Order by ID
exports.getLaundryOrderById = async (req, res) => {
  try {
    const order = await Laundry.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Order
exports.updateLaundryOrder = async (req, res) => {
  try {
    const order = await Laundry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Status
exports.updateLaundryStatus = async (req, res) => {
  try {
    const order = await Laundry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cancel Order
exports.cancelLaundryOrder = async (req, res) => {
  try {
    const order = await Laundry.findByIdAndUpdate(
      req.params.id,
      { isCancelled: true, laundryStatus: 'cancelled' },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Orders by Room
exports.getLaundryByRoom = async (req, res) => {
  try {
    const orders = await Laundry.find({ roomNumber: req.params.roomNumber }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Orders by Status
exports.getLaundryByStatus = async (req, res) => {
  try {
    const orders = await Laundry.find({ laundryStatus: req.params.status }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Orders by Vendor
exports.getLaundryByVendor = async (req, res) => {
  try {
    const orders = await Laundry.find({ vendorId: req.params.vendorId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Orders by Booking
exports.getLaundryByBooking = async (req, res) => {
  try {
    const orders = await Laundry.find({ bookingId: req.params.bookingId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Report Item Damage/Loss
exports.reportDamageOrLoss = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { damageReported, itemNotes } = req.body;
    
    const order = await Laundry.findOne({ 'items._id': itemId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.damageReported = damageReported;
    if (itemNotes) item.itemNotes = itemNotes;
    
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create Loss Report
exports.createLossReport = async (req, res) => {
  try {
    const lossReport = await LaundryLoss.create(req.body);
    res.status(201).json({ success: true, lossReport });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Loss Reports
exports.getAllLossReports = async (req, res) => {
  try {
    const reports = await LaundryLoss.find().populate('orderId').sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Loss Report by ID
exports.getLossReportById = async (req, res) => {
  try {
    const report = await LaundryLoss.findById(req.params.id).populate('orderId');
    if (!report) return res.status(404).json({ error: 'Loss report not found' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Loss Report Status
exports.updateLossReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const report = await LaundryLoss.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!report) return res.status(404).json({ error: 'Loss report not found' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Order
exports.deleteLaundry = async (req, res) => {
  try {
    const order = await Laundry.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
