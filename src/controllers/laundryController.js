const Laundry = require('../models/Laundry');
const LaundryItem = require('../models/LaundryItem');
const LaundryLoss = require('../models/LaundryLoss');
const LaundryVendor = require('../models/LaundryVendor');
const mongoose = require('mongoose');

// Create Order
exports.createLaundryOrder = async (req, res) => {
  try {
    const order = await Laundry.create(req.body);
    
    // Add item status summary
    const itemStatusCounts = order.items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    
    const orderWithSummary = {
      ...order.toObject(),
      itemStatusSummary: itemStatusCounts
    };
    
    res.status(201).json({ success: true, order: orderWithSummary });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Orders with filtering
exports.getAllLaundryOrders = async (req, res) => {
  try {
    const { status, orderType, search, startDate, endDate, itemStatus } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.laundryStatus = status;
    }
    
    // Filter by order type
    if (orderType && orderType !== 'all') {
      query.orderType = orderType;
    }
    
    // Filter by item status
    if (itemStatus && itemStatus !== 'all') {
      query['items.status'] = itemStatus;
    }
    
    // Search by room number or GRC
    if (search) {
      query.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { grcNo: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }
    
    const orders = await Laundry.find(query).sort({ createdAt: -1 });
    
    // Add item status summary for each order
    const ordersWithSummary = orders.map(order => {
      const itemStatusCounts = order.items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      return {
        ...order.toObject(),
        itemStatusSummary: itemStatusCounts
      };
    });
    
    res.json({ success: true, orders: ordersWithSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Order by ID
exports.getLaundryOrderById = async (req, res) => {
  try {
    const order = await Laundry.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Add item status summary
    const itemStatusCounts = order.items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    
    const orderWithSummary = {
      ...order.toObject(),
      itemStatusSummary: itemStatusCounts
    };
    
    res.json({ success: true, order: orderWithSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Order
exports.updateLaundryOrder = async (req, res) => {
  try {
    const order = await Laundry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    // Add item status summary
    const itemStatusCounts = order.items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
    
    const orderWithSummary = {
      ...order.toObject(),
      itemStatusSummary: itemStatusCounts
    };
    
    res.json({ success: true, order: orderWithSummary });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Status
exports.updateLaundryStatus = async (req, res) => {
  try {
    const { laundryStatus, updateAllItems } = req.body;
    const order = await Laundry.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    order.laundryStatus = laundryStatus;
    
    // Optionally update all item statuses to match order status
    if (updateAllItems) {
      order.items.forEach(item => {
        if (item.status !== 'cancelled' && !item.damageReported) {
          item.status = laundryStatus;
        }
      });
    }
    
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Cancel Order
exports.cancelLaundryOrder = async (req, res) => {
  try {
    const { cancelAllItems } = req.body;
    const order = await Laundry.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    order.laundryStatus = 'cancelled';
    
    // Optionally cancel all items
    if (cancelAllItems) {
      order.items.forEach(item => {
        if (item.status !== 'delivered') {
          item.status = 'cancelled';
        }
      });
    }
    
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Orders by Room
exports.getLaundryByRoom = async (req, res) => {
  try {
    const { itemStatus } = req.query;
    let query = { roomNumber: req.params.roomNumber };
    
    if (itemStatus && itemStatus !== 'all') {
      query['items.status'] = itemStatus;
    }
    
    const orders = await Laundry.find(query).sort({ createdAt: -1 });
    
    // Add item status summary for each order
    const ordersWithSummary = orders.map(order => {
      const itemStatusCounts = order.items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      return {
        ...order.toObject(),
        itemStatusSummary: itemStatusCounts
      };
    });
    
    res.json({ success: true, orders: ordersWithSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Orders by Status
exports.getLaundryByStatus = async (req, res) => {
  try {
    const { itemStatus } = req.query;
    let query = { laundryStatus: req.params.status };
    
    if (itemStatus && itemStatus !== 'all') {
      query['items.status'] = itemStatus;
    }
    
    const orders = await Laundry.find(query).sort({ createdAt: -1 });
    
    // Add item status summary for each order
    const ordersWithSummary = orders.map(order => {
      const itemStatusCounts = order.items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      return {
        ...order.toObject(),
        itemStatusSummary: itemStatusCounts
      };
    });
    
    res.json({ success: true, orders: ordersWithSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Items by Status
exports.getItemsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { roomNumber, serviceType } = req.query;
    
    let matchQuery = {};
    
    if (roomNumber) {
      matchQuery.roomNumber = { $regex: roomNumber, $options: 'i' };
    }
    
    if (serviceType) {
      matchQuery.serviceType = serviceType;
    }
    
    const orders = await Laundry.find({
      ...matchQuery,
      'items.status': status
    }).sort({ createdAt: -1 });
    
    // Filter items to only include those with the requested status
    const filteredOrders = orders.map(order => ({
      ...order.toObject(),
      items: order.items.filter(item => item.status === status)
    }));
    
    res.json({ success: true, orders: filteredOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Orders by Vendor
exports.getLaundryByVendor = async (req, res) => {
  try {
    const { itemStatus } = req.query;
    let query = { vendorId: req.params.vendorId };
    
    if (itemStatus && itemStatus !== 'all') {
      query['items.status'] = itemStatus;
    }
    
    const orders = await Laundry.find(query).sort({ createdAt: -1 });
    
    // Add item status summary for each order
    const ordersWithSummary = orders.map(order => {
      const itemStatusCounts = order.items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      return {
        ...order.toObject(),
        itemStatusSummary: itemStatusCounts
      };
    });
    
    res.json({ success: true, orders: ordersWithSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Orders by Booking
exports.getLaundryByBooking = async (req, res) => {
  try {
    const { itemStatus } = req.query;
    let query = { bookingId: req.params.bookingId };
    
    if (itemStatus && itemStatus !== 'all') {
      query['items.status'] = itemStatus;
    }
    
    const orders = await Laundry.find(query).sort({ createdAt: -1 });
    
    // Add item status summary for each order
    const ordersWithSummary = orders.map(order => {
      const itemStatusCounts = order.items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      return {
        ...order.toObject(),
        itemStatusSummary: itemStatusCounts
      };
    });
    
    res.json({ success: true, orders: ordersWithSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Inhouse Orders
exports.getInhouseOrders = async (req, res) => {
  try {
    const { itemStatus } = req.query;
    let query = { serviceType: 'inhouse' };
    
    if (itemStatus && itemStatus !== 'all') {
      query['items.status'] = itemStatus;
    }
    
    const orders = await Laundry.find(query).sort({ createdAt: -1 });
    
    // Add item status summary for each order
    const ordersWithSummary = orders.map(order => {
      const itemStatusCounts = order.items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      return {
        ...order.toObject(),
        itemStatusSummary: itemStatusCounts
      };
    });
    
    res.json({ success: true, orders: ordersWithSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Vendor Orders
exports.getVendorOrders = async (req, res) => {
  try {
    const { itemStatus } = req.query;
    let query = { serviceType: 'vendor' };
    
    if (itemStatus && itemStatus !== 'all') {
      query['items.status'] = itemStatus;
    }
    
    const orders = await Laundry.find(query).sort({ createdAt: -1 });
    
    // Add item status summary for each order
    const ordersWithSummary = orders.map(order => {
      const itemStatusCounts = order.items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      return {
        ...order.toObject(),
        itemStatusSummary: itemStatusCounts
      };
    });
    
    res.json({ success: true, orders: ordersWithSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Available Items by Service Type
exports.getAvailableItems = async (req, res) => {
  try {
    const { serviceType, vendorId } = req.query;
    
    let query = { isActive: true };
    
    if (serviceType === 'vendor' && vendorId) {
      query.vendorId = vendorId;
    } else if (serviceType === 'inhouse') {
      query.vendorId = { $exists: false };
    }
    
    const items = await LaundryItem.find(query).sort({ itemName: 1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Report Item Damage/Loss
exports.reportDamageOrLoss = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { description, reportType } = req.body; // reportType: 'damage' or 'loss'
    
    const order = await Laundry.findOne({ 'items._id': itemId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.damageReported = true;
    item.itemNotes = `${reportType?.toUpperCase() || 'DAMAGE'}: ${description}`;
    item.status = reportType === 'loss' ? 'lost' : 'cancelled';
    
    await order.save();
    res.json({ success: true, order, message: `Item ${reportType || 'damage'} reported successfully` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create Loss Report
exports.createLossReport = async (req, res) => {
  try {
    const { orderId, roomNumber, guestName, lostItems, lossNote, reportedBy } = req.body;
    
    // Calculate total loss amount
    const totalLossAmount = lostItems.reduce((total, item) => total + (item.calculatedAmount || 0), 0);
    
    const lossReportData = {
      orderId,
      roomNumber,
      guestName,
      lostItems,
      lossNote,
      reportedBy,
      totalLossAmount
    };
    
    const lossReport = await LaundryLoss.create(lossReportData);
    
    // Update item statuses to cancelled in the original order
    if (orderId && lostItems.length > 0) {
      const order = await Laundry.findById(orderId);
      if (order) {
        lostItems.forEach(lostItem => {
          const item = order.items.id(lostItem.itemId);
          if (item) {
            item.status = 'lost';
            item.damageReported = true;
            item.itemNotes = `LOST: ${lossNote}`;
          }
        });
        await order.save();
      }
    }
    
    res.status(201).json({ success: true, lossReport });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Loss Reports
exports.getAllLossReports = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    const reports = await LaundryLoss.find(query).populate('orderId').sort({ createdAt: -1 });
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

// Get Dashboard Statistics
exports.getLaundryDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    // Order status summary
    const orderStats = await Laundry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$laundryStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // Item status summary
    const itemStats = await Laundry.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$items.calculatedAmount' }
        }
      }
    ]);
    
    // Service type summary
    const serviceStats = await Laundry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // Recent orders
    const recentOrders = await Laundry.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('roomNumber grcNo laundryStatus totalAmount createdAt items.status');
    
    res.json({
      success: true,
      dashboard: {
        orderStats,
        itemStats,
        serviceStats,
        recentOrders
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Update Item Status
exports.updateItemStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status, deliveredQuantity } = req.body;
    
    const order = await Laundry.findOne({ 'items._id': itemId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    item.status = status;
    if (deliveredQuantity !== undefined) {
      item.deliveredQuantity = deliveredQuantity;
    }
    
    // Auto-update order status based on item statuses
    const allItems = order.items;
    const itemStatuses = allItems.map(item => item.status);
    
    if (itemStatuses.every(s => s === 'delivered')) {
      order.laundryStatus = 'delivered';
    } else if (itemStatuses.some(s => s === 'ready') && !itemStatuses.some(s => ['pending', 'picked_up'].includes(s))) {
      order.laundryStatus = 'ready';
    } else if (itemStatuses.some(s => s === 'picked_up')) {
      order.laundryStatus = 'picked_up';
    }
    
    await order.save();
    res.json({ success: true, order, message: 'Item status updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Bulk Update Item Status
exports.bulkUpdateItemStatus = async (req, res) => {
  try {
    const { items } = req.body; // Array of {itemId, orderId, status, deliveredQuantity}
    
    const results = [];
    
    for (const itemUpdate of items) {
      const { itemId, orderId, status, deliveredQuantity } = itemUpdate;
      
      const order = await Laundry.findById(orderId);
      if (!order) {
        results.push({ itemId, error: 'Order not found' });
        continue;
      }
      
      const item = order.items.id(itemId);
      if (!item) {
        results.push({ itemId, error: 'Item not found' });
        continue;
      }
      
      item.status = status;
      if (deliveredQuantity !== undefined) {
        item.deliveredQuantity = deliveredQuantity;
      }
      
      await order.save();
      results.push({ itemId, success: true });
    }
    
    res.json({ success: true, results, message: 'Bulk update completed' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Vendor Details
exports.updateVendorDetails = async (req, res) => {
  try {
    const { vendorOrderId, vendorNotes, vendorPickupTime, vendorDeliveryTime } = req.body;
    
    const order = await Laundry.findByIdAndUpdate(
      req.params.id,
      { vendorOrderId, vendorNotes, vendorPickupTime, vendorDeliveryTime },
      { new: true, runValidators: true }
    );
    
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get Item Status Overview
exports.getItemStatusOverview = async (req, res) => {
  try {
    const { status, roomNumber, startDate, endDate } = req.query;
    
    let matchQuery = {};
    
    // Filter by date range
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    // Filter by room number
    if (roomNumber) {
      matchQuery.roomNumber = { $regex: roomNumber, $options: 'i' };
    }
    
    const pipeline = [
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'laundryitems',
          localField: 'items.rateId',
          foreignField: '_id',
          as: 'itemDetails'
        }
      },
      { $unwind: { path: '$itemDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          orderId: '$_id',
          orderType: 1,
          roomNumber: 1,
          grcNo: 1,
          requestedByName: 1,
          serviceType: 1,
          orderStatus: '$laundryStatus',
          orderCreatedAt: '$createdAt',
          itemId: '$items._id',
          itemName: '$items.itemName',
          itemStatus: '$items.status',
          quantity: '$items.quantity',
          deliveredQuantity: '$items.deliveredQuantity',
          calculatedAmount: '$items.calculatedAmount',
          damageReported: '$items.damageReported',
          itemNotes: '$items.itemNotes',
          itemRate: '$itemDetails.rate'
        }
      }
    ];
    
    // Filter by item status if provided
    if (status && status !== 'all') {
      pipeline.push({ $match: { itemStatus: status } });
    }
    
    pipeline.push({ $sort: { orderCreatedAt: -1 } });
    
    const items = await Laundry.aggregate(pipeline);
    
    // Get status summary
    const statusSummary = await Laundry.aggregate([
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$items.calculatedAmount' }
        }
      }
    ]);
    
    res.json({ 
      success: true, 
      items,
      statusSummary,
      totalItems: items.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};