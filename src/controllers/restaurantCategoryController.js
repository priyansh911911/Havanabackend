const RestaurantCategory = require('../models/RestaurantCategory.js');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await RestaurantCategory.find()
      .sort({ createdAt: -1 })
      .maxTimeMS(5000)
      .lean()
      .exec();
    res.json(categories);
  } catch (error) {
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      res.status(408).json({ error: 'Database query timeout. Please try again.' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

// Add new category
exports.addCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const category = new RestaurantCategory({ name, description, status });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const category = await RestaurantCategory.findByIdAndUpdate(
      req.params.id,
      { name, description, status },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await RestaurantCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};