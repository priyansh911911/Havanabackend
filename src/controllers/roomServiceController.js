const RoomService = require("../models/RoomService");
let RestaurantOrder;
try {
  RestaurantOrder = require("../models/RestaurantOrder");
} catch (error) {
  console.warn('RestaurantOrder model not found, room service will work with RoomService model only');
}

// Create room service order (integrates with restaurant orders)
exports.createOrder = async (req, res) => {
  try {
    const { serviceType, roomNumber, guestName, grcNo, bookingId, items, notes } = req.body;
    
    if (!roomNumber || !bookingId || !serviceType || !items || items.length === 0) {
      return res.status(400).json({ message: "Missing required fields: roomNumber, bookingId, serviceType, and items are required" });
    }

    const orderCount = await RoomService.countDocuments();
    const orderNumber = `RS${Date.now().toString().slice(-6)}${(orderCount + 1).toString().padStart(3, '0')}`;

    let subtotal = 0;
    const processedItems = items.map(item => {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      return {
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        category: item.category || 'Restaurant',
        specialInstructions: item.specialInstructions || ''
      };
    });

    const totalAmount = subtotal;

    const order = new RoomService({
      orderNumber,
      serviceType,
      roomNumber,
      guestName: guestName || 'Guest',
      grcNo,
      bookingId,
      items: processedItems,
      subtotal,
      tax: 0,
      serviceCharge: 0,
      totalAmount,
      kotGenerated: true,
      kotNumber: `KOT-${Date.now()}`,
      kotGeneratedAt: new Date(),
      notes: notes || ''
    });

    await order.save();
    res.status(201).json({ success: true, message: 'Room service order created successfully', order });
  } catch (error) {
    console.error('Room service creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all orders (combines restaurant and room service orders)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, bookingId, serviceType, grcNo, page = 1, limit = 20 } = req.query;
    
    // Get restaurant orders (room service)
    let restaurantOrders = [];
    if (RestaurantOrder) {
      let restaurantFilter = {};
      if (grcNo) restaurantFilter.grcNo = grcNo;
      if (status) restaurantFilter.status = status;
      
      restaurantOrders = await RestaurantOrder.find({
        ...restaurantFilter,
        tableNo: { $regex: '^R' }
      }).sort({ createdAt: -1 });
    }
    
    // Get room service orders (non-restaurant)
    let roomServiceFilter = {};
    if (status) roomServiceFilter.status = status;
    if (bookingId) roomServiceFilter.bookingId = bookingId;
    if (serviceType && serviceType !== 'Restaurant') roomServiceFilter.serviceType = serviceType;
    if (grcNo) roomServiceFilter.grcNo = grcNo;

    const roomServiceOrders = await RoomService.find(roomServiceFilter)
      .populate("createdBy", "username")
      .populate("bookingId", "name grcNo")
      .sort({ createdAt: -1 });

    // Combine and format orders
    const allOrders = [
      ...restaurantOrders.map(order => ({
        ...order.toObject(),
        serviceType: 'Restaurant',
        orderNumber: order._id.toString().slice(-6),
        totalAmount: Math.round(order.amount * 1.28)
      })),
      ...roomServiceOrders.map(order => order.toObject())
    ];

    // Sort by creation date
    allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedOrders = allOrders.slice(startIndex, endIndex);

    res.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allOrders.length / limit),
        totalOrders: allOrders.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    let order = await RoomService.findById(req.params.id)
      .populate("createdBy", "username")
      .populate("bookingId", "name grcNo phoneNumber");

    if (!order && RestaurantOrder) {
      order = await RestaurantOrder.findById(req.params.id);
      if (order) {
        order = {
          ...order.toObject(),
          serviceType: 'Restaurant',
          orderNumber: order._id.toString().slice(-6),
          totalAmount: Math.round(order.amount * 1.28)
        };
      }
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let order = await RoomService.findById(req.params.id);

    if (!order && RestaurantOrder) {
      order = await RestaurantOrder.findById(req.params.id);
      if (order) {
        order.status = status;
        if (status === "delivered" || status === "served") {
          order.deliveryTime = new Date();
        }
        await order.save();
        return res.json({ success: true, order });
      }
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    if (status === "delivered") {
      order.deliveryTime = new Date();
    }

    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate KOT
exports.generateKOT = async (req, res) => {
  try {
    let order = await RoomService.findById(req.params.id);
    let isRestaurantOrder = false;

    if (!order && RestaurantOrder) {
      order = await RestaurantOrder.findById(req.params.id);
      isRestaurantOrder = true;
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.kotGenerated) {
      return res.status(400).json({ message: "KOT already generated" });
    }

    // Generate 4-digit KOT number
    const KOT = require('../models/KOT');
    const today = new Date();
    const count = await KOT.countDocuments({
      createdAt: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    });
    const nextNumber = (count % 9999) + 1;
    const kotNumber = String(nextNumber).padStart(4, '0');
    
    order.kotGenerated = true;
    order.kotNumber = kotNumber;
    order.kotGeneratedAt = new Date();
    order.status = "confirmed";

    await order.save();
    res.json({ success: true, order, kotNumber });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Bill
exports.generateBill = async (req, res) => {
  try {
    let order = await RoomService.findById(req.params.id);
    let isRestaurantOrder = false;

    if (!order && RestaurantOrder) {
      order = await RestaurantOrder.findById(req.params.id);
      isRestaurantOrder = true;
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.billGenerated) {
      return res.status(400).json({ message: "Bill already generated" });
    }

    const billNumber = `BILL${Date.now().toString().slice(-8)}`;
    order.billGenerated = true;
    order.billNumber = billNumber;
    order.billGeneratedAt = new Date();

    await order.save();
    res.json({ success: true, order, billNumber });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bill lookup (searches both restaurant and room service orders)
exports.billLookup = async (req, res) => {
  try {
    const { billNumber, orderNumber, bookingId, grcNo } = req.query;

    let orders = [];

    // Search restaurant orders (room service)
    if (RestaurantOrder && grcNo) {
      let restaurantFilter = {};
      if (grcNo) restaurantFilter.grcNo = grcNo;
      
      const restaurantOrders = await RestaurantOrder.find({
        ...restaurantFilter,
        tableNo: { $regex: '^R' }
      }).sort({ createdAt: -1 });
      
      orders.push(...restaurantOrders.map(order => ({
        ...order.toObject(),
        serviceType: 'Restaurant',
        orderNumber: order._id.toString().slice(-6),
        totalAmount: Math.round(order.amount * 1.28)
      })));
    }

    // Search room service orders
    let roomServiceFilter = {};
    if (billNumber) roomServiceFilter.billNumber = billNumber;
    if (orderNumber) roomServiceFilter.orderNumber = orderNumber;
    if (bookingId) roomServiceFilter.bookingId = bookingId;
    if (grcNo) roomServiceFilter.grcNo = grcNo;

    if (Object.keys(roomServiceFilter).length > 0) {
      const roomServiceOrders = await RoomService.find(roomServiceFilter)
        .populate("createdBy", "username")
        .populate("bookingId", "name grcNo phoneNumber")
        .sort({ createdAt: -1 });
      
      orders.push(...roomServiceOrders.map(order => order.toObject()));
    }

    // Remove duplicates and sort
    const uniqueOrders = orders.filter((order, index, self) => 
      index === self.findIndex(o => o._id.toString() === order._id.toString())
    );
    
    uniqueOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, orders: uniqueOrders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get room service charges for checkout
exports.getRoomServiceCharges = async (req, res) => {
  try {
    const { bookingId, grcNo } = req.query;
    
    if (!bookingId && !grcNo) {
      return res.status(400).json({ message: "Booking ID or GRC number is required" });
    }

    let orders = [];
    let totalCharges = 0;

    // Get room service orders
    let roomServiceFilter = {
      paymentStatus: { $ne: 'paid' }
    };
    
    if (bookingId) {
      roomServiceFilter.bookingId = bookingId;
    } else if (grcNo) {
      roomServiceFilter.grcNo = grcNo;
    }

    const roomServiceOrders = await RoomService.find(roomServiceFilter)
      .select('orderNumber serviceType totalAmount items createdAt roomNumber guestName')
      .sort({ createdAt: -1 });

    orders = roomServiceOrders.map(order => ({
      orderNumber: order.orderNumber,
      serviceType: order.serviceType || 'Room Service',
      totalAmount: order.totalAmount,
      items: order.items,
      createdAt: order.createdAt,
      roomNumber: order.roomNumber,
      guestName: order.guestName,
      _id: order._id
    }));

    totalCharges = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      success: true,
      orders,
      totalCharges,
      count: orders.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark room service orders as paid (includes both restaurant and room service)
exports.markOrdersPaid = async (req, res) => {
  try {
    const { bookingId, grcNo } = req.body;
    
    if (!bookingId && !grcNo) {
      return res.status(400).json({ message: "Booking ID or GRC number is required" });
    }

    // Mark restaurant orders as paid
    if (RestaurantOrder) {
      let restaurantFilter = {
        tableNo: { $regex: '^R' },
        status: { $in: ['served', 'delivered'] },
        paymentStatus: { $ne: 'paid' }
      };
      
      if (bookingId) restaurantFilter.bookingId = bookingId;
      if (grcNo) restaurantFilter.grcNo = grcNo;

      await RestaurantOrder.updateMany(restaurantFilter, {
        paymentStatus: 'paid',
        status: 'paid'
      });
    }

    // Mark room service orders as paid
    let roomServiceFilter = {
      status: "delivered",
      paymentStatus: "unpaid"
    };
    
    if (bookingId) {
      roomServiceFilter.bookingId = bookingId;
    } else if (grcNo) {
      roomServiceFilter.grcNo = grcNo;
    }

    await RoomService.updateMany(roomServiceFilter, {
      paymentStatus: "paid"
    });

    res.json({ success: true, message: "Room service orders marked as paid" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    let order = await RoomService.findById(req.params.id);

    if (!order && RestaurantOrder) {
      order = await RestaurantOrder.findById(req.params.id);
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete order
exports.deleteOrder = async (req, res) => {
  try {
    let order = await RoomService.findById(req.params.id);
    let isRestaurantOrder = false;

    if (!order && RestaurantOrder) {
      order = await RestaurantOrder.findById(req.params.id);
      isRestaurantOrder = true;
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Cannot delete confirmed orders" });
    }

    if (isRestaurantOrder) {
      await RestaurantOrder.findByIdAndDelete(req.params.id);
    } else {
      await RoomService.findByIdAndDelete(req.params.id);
    }
    
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};