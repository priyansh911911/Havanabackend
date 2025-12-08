const LaundryItem = require('../models/LaundryItem.js');
const LaundryVendor = require('../models/LaundryVendor.js');

// Create a new laundry item
exports.createLaundryItem = async (req, res) => {
  try {
    const { category, serviceType, itemName, rate, unit, vendorId, isActive } = req.body;
    const laundryItem = new LaundryItem({ category, serviceType, itemName, rate, unit, vendorId, isActive });
    await laundryItem.save();
    res.status(201).json({ success: true, laundryItem });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all laundry items
exports.getLaundryItems = async (req, res) => {
  try {
    const laundryItems = await LaundryItem.find()
      .populate('vendorId', 'vendorName')
      .sort({ category: 1, itemName: 1 })
      .maxTimeMS(5000)
      .lean()
      .exec();
    res.json({ success: true, laundryItems });
  } catch (error) {
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      res.status(408).json({ error: 'Database query timeout. Please try again.' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

// Get a laundry item by ID
exports.getLaundryItemById = async (req, res) => {
  try {
    const laundryItem = await LaundryItem.findById(req.params.id).populate('vendorId', 'vendorName');
    if (!laundryItem) return res.status(404).json({ error: 'Laundry item not found' });
    res.json({ success: true, laundryItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a laundry item
exports.updateLaundryItem = async (req, res) => {
  try {
    const { category, serviceType, itemName, rate, unit, vendorId, isActive } = req.body;
    const laundryItem = await LaundryItem.findByIdAndUpdate(
      req.params.id,
      { category, serviceType, itemName, rate, unit, vendorId, isActive },
      { new: true, runValidators: true }
    ).populate('vendorId', 'vendorName');
    if (!laundryItem) return res.status(404).json({ error: 'Laundry item not found' });
    res.json({ success: true, laundryItem });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a laundry item
exports.deleteLaundryItem = async (req, res) => {
  try {
    const laundryItem = await LaundryItem.findByIdAndDelete(req.params.id);
    if (!laundryItem) return res.status(404).json({ error: 'Laundry item not found' });
    res.json({ success: true, message: 'Laundry item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get laundry items by category
exports.getLaundryItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const laundryItems = await LaundryItem.find({ category, isActive: true })
      .populate('vendorId', 'vendorName')
      .sort({ itemName: 1 });
    res.json({ success: true, laundryItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get laundry items by vendor
exports.getLaundryItemsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const laundryItems = await LaundryItem.find({ vendorId, isActive: true })
      .populate('vendorId', 'vendorName')
      .sort({ category: 1, itemName: 1 });
    res.json({ success: true, laundryItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};