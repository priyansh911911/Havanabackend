const RestaurantOrder = require('../models/RestaurantOrder.js');

// Create new restaurant order
exports.createOrder = async (req, res) => {
  try {
    const order = new RestaurantOrder(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await RestaurantOrder.find()
      .sort({ createdAt: -1 })
      .populate('items.itemId', 'name price')
      .populate('bookingId', 'grcNo roomNumber guestName')
      .maxTimeMS(5000)
      .lean()
      .exec();
    res.json(orders);
  } catch (error) {
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      res.status(408).json({ error: 'Database query timeout. Please try again.' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await RestaurantOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};