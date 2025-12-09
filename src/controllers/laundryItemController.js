const LaundryItem = require('../models/LaundryItem.js');
const LaundryVendor = require('../models/LaundryVendor.js');

// Create a new laundry item
exports.createLaundryItem = async (req, res) => {
  try {
    const { category, serviceType, itemName, rate, unit, vendorId, isActive } = req.body;
    
    // Basic validation
    if (!category || !serviceType || !itemName || !rate) {
      return res.status(400).json({ error: 'Category, service type, item name, and rate are required' });
    }
    
    if (rate <= 0) {
      return res.status(400).json({ error: 'Rate must be greater than 0' });
    }
    
    // Validate vendor if provided
    if (vendorId) {
      const vendor = await LaundryVendor.findById(vendorId);
      if (!vendor) {
        return res.status(400).json({ error: 'Vendor not found' });
      }
      if (!vendor.isActive) {
        return res.status(400).json({ error: 'Vendor is not active' });
      }
    }
    
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
    
    // Validate vendor if provided
    if (vendorId) {
      const vendor = await LaundryVendor.findById(vendorId);
      if (!vendor) {
        return res.status(400).json({ error: 'Vendor not found' });
      }
      if (!vendor.isActive) {
        return res.status(400).json({ error: 'Vendor is not active' });
      }
    }
    
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
    const validCategories = ['gentlemen', 'ladies', 'Hotel Laundry'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Valid categories: gentlemen, ladies, Hotel Laundry' });
    }
    
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