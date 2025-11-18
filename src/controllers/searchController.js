const BanquetBooking = require('../models/banquetBooking');
const BanquetCategory = require('../models/banquetCategory');
const BanquetMenu = require('../models/BanquetMenu');
const Booking = require('../models/Booking');
const Category = require('../models/Category');
const Checkout = require('../models/Checkout');

// Universal search across all models
exports.universalSearch = async (req, res) => {
  try {
    const { query, type, limit = 10 } = req.query;
    if (!query) return res.status(400).json({ error: 'Search query is required' });

    const searchLimit = parseInt(limit);
    const results = {};

    // Search in specific model if type is provided
    if (type) {
      results[type] = await searchInModel(type, query, searchLimit);
    } else {
      // Search across all models
      const models = ['banquetBookings', 'banquetCategories', 'banquetMenus', 'bookings', 'categories', 'checkouts'];
      
      for (const modelType of models) {
        results[modelType] = await searchInModel(modelType, query, searchLimit);
      }
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search in specific model
const searchInModel = async (type, query, limit) => {
  const searchRegex = new RegExp(query, 'i');
  
  try {
    switch (type) {
      case 'banquetBookings':
        return await BanquetBooking.find({
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { number: searchRegex },
            { hall: searchRegex },
            { functionType: searchRegex }
          ]
        }).limit(limit);

      case 'banquetCategories':
        return await BanquetCategory.find({
          $or: [
            { name: searchRegex },
            { description: searchRegex }
          ]
        }).limit(limit);

      case 'banquetMenus':
        return await BanquetMenu.find({
          $or: [
            { name: searchRegex },
            { category: searchRegex },
            { description: searchRegex }
          ]
        }).limit(limit);

      case 'bookings':
        return await Booking.find({
          $or: [
            { guestName: searchRegex },
            { phoneNumber: searchRegex },
            { email: searchRegex }
          ]
        }).limit(limit);

      case 'categories':
        return await Category.find({
          $or: [
            { name: searchRegex },
            { description: searchRegex }
          ]
        }).limit(limit);

      case 'checkouts':
        return await Checkout.find({
          $or: [
            { guestName: searchRegex },
            { roomNumber: searchRegex }
          ]
        }).limit(limit);

      default:
        return [];
    }
  } catch (error) {
    console.error(`Error searching in ${type}:`, error);
    return [];
  }
};

// Search by specific field
exports.searchByField = async (req, res) => {
  try {
    const { model, field, value, limit = 10 } = req.query;
    
    if (!model || !field || !value) {
      return res.status(400).json({ error: 'Model, field, and value are required' });
    }

    const results = await searchBySpecificField(model, field, value, parseInt(limit));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchBySpecificField = async (model, field, value, limit) => {
  const searchRegex = new RegExp(value, 'i');
  const filter = { [field]: searchRegex };

  switch (model) {
    case 'banquetBookings':
      return await BanquetBooking.find(filter).limit(limit);
    case 'banquetCategories':
      return await BanquetCategory.find(filter).limit(limit);
    case 'banquetMenus':
      return await BanquetMenu.find(filter).limit(limit);
    case 'bookings':
      return await Booking.find(filter).limit(limit);
    case 'categories':
      return await Category.find(filter).limit(limit);
    case 'checkouts':
      return await Checkout.find(filter).limit(limit);
    default:
      return [];
  }
};