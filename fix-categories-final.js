const mongoose = require('mongoose');
const Room = require('./src/models/Room.js');
const Category = require('./src/models/Category.js');

async function fixCategories() {
  try {
    // Connect to the correct MongoDB instance
    await mongoose.connect('mongodb+srv://anshusharma42019:42019@cluster0.bubhmal.mongodb.net/Havana-Backend?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');

    // Get all categories
    const categories = await Category.find({});
    console.log('Available categories:', categories.map(c => ({ id: c._id, name: c.name })));

    // Find the correct categories
    const superPremiumCategory = categories.find(c => c.name.includes('SUPER PREMIUM'));
    const deluxeCategory = categories.find(c => c.name === 'DELUXE');
    
    console.log('Super Premium Category:', superPremiumCategory);
    console.log('Deluxe Category:', deluxeCategory);

    // Update room 206 to SUPER PREMIUM DELUXE
    if (superPremiumCategory) {
      const result206 = await Room.updateOne(
        { room_number: '206' },
        { categoryId: superPremiumCategory._id }
      );
      console.log('Updated room 206:', result206);
    }

    // Update room 106 to DELUXE (if it exists)
    if (deluxeCategory) {
      const result106 = await Room.updateOne(
        { room_number: '106' },
        { categoryId: deluxeCategory._id }
      );
      console.log('Updated room 106:', result106);
    }

    // Show final room assignments
    const rooms = await Room.find({}).populate('categoryId');
    console.log('\nFinal room assignments:');
    rooms.forEach(room => {
      console.log(`Room ${room.room_number}: ${room.categoryId?.name || 'No category'} (Price: ₹${room.price})`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixCategories();