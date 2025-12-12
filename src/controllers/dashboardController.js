const Booking = require('../models/Booking');
const RestaurantOrder = require('../models/RestaurantOrder');

exports.getDashboardStats = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    
    // Date range calculation
    let dateFilter = {};
    const now = new Date();
    
    switch (filter) {
      case 'today':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        };
        break;
      case 'weekly':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFilter = { createdAt: { $gte: weekStart } };
        break;
      case 'monthly':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          }
        };
        break;
      case 'yearly':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lt: new Date(now.getFullYear() + 1, 0, 1)
          }
        };
        break;
      case 'range':
        if (startDate && endDate) {
          dateFilter = {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          };
        }
        break;
    }

    // Base query
    const baseQuery = { deleted: { $ne: true }, ...dateFilter };

    // Parallel queries for better performance
    const [
      totalBookings,
      activeBookings,
      cancelledBookings,
      cashPayments,
      upiPayments,
      totalRevenue
    ] = await Promise.all([
      Booking.countDocuments(baseQuery),
      Booking.countDocuments({ ...baseQuery, status: 'Checked In' }),
      Booking.countDocuments({ ...baseQuery, status: 'Cancelled' }),
      Booking.countDocuments({ ...baseQuery, paymentMode: /cash/i }),
      Booking.countDocuments({ ...baseQuery, paymentMode: /upi/i }),
      Booking.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, total: { $sum: '$rate' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalBookings,
        activeBookings,
        cancelledBookings,
        payments: {
          cash: cashPayments,
          upi: upiPayments,
          other: totalBookings - cashPayments - upiPayments
        },
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.downloadDashboardCSV = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    
    // Date range calculation (same as getDashboardStats)
    let dateFilter = {};
    const now = new Date();
    
    switch (filter) {
      case 'today':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        };
        break;
      case 'weekly':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFilter = { createdAt: { $gte: weekStart } };
        break;
      case 'monthly':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1),
            $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
          }
        };
        break;
      case 'yearly':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1),
            $lt: new Date(now.getFullYear() + 1, 0, 1)
          }
        };
        break;
      case 'range':
        if (startDate && endDate) {
          dateFilter = {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          };
        }
        break;
    }

    // Base queries
    const bookingQuery = { deleted: { $ne: true }, ...dateFilter };
    const restaurantQuery = { ...dateFilter };

    // Get all data
    const [
      totalBookings,
      activeBookings,
      cancelledBookings,
      cashPayments,
      onlinePayments,
      totalRevenue,
      restaurantOrders
    ] = await Promise.all([
      Booking.countDocuments(bookingQuery),
      Booking.countDocuments({ ...bookingQuery, status: 'Checked In' }),
      Booking.countDocuments({ ...bookingQuery, status: 'Cancelled' }),
      Booking.countDocuments({ ...bookingQuery, paymentMode: /cash/i }),
      Booking.countDocuments({ ...bookingQuery, paymentMode: /upi|online|card/i }),
      Booking.aggregate([
        { $match: bookingQuery },
        { $group: { _id: null, total: { $sum: '$rate' } } }
      ]),
      RestaurantOrder.countDocuments(restaurantQuery)
    ]);

    // Create CSV data with individual metrics
    const csvData = [
      ['Total Bookings', totalBookings],
      ['Active Bookings', activeBookings], 
      ['Cancelled Bookings', cancelledBookings],
      ['Total Revenue', totalRevenue[0]?.total || 0],
      ['Online Payments', onlinePayments],
      ['Cash Payments', cashPayments],
      ['Restaurant Orders', restaurantOrders]
    ];

    // Convert to CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');

    // Set headers for CSV download
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dashboard-stats-${timestamp}.csv"`);
    
    res.send(csvString);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Individual CSV exports
exports.exportTotalBookings = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const bookings = await Booking.find({ deleted: { $ne: true }, ...dateFilter }).select('guestName phoneNumber checkInDate checkOutDate rate status createdAt');
    const csvData = [['Guest Name', 'Phone', 'Check In', 'Check Out', 'Rate', 'Status', 'Booking Date']];
    bookings.forEach(b => csvData.push([
      b.guestName, 
      b.phoneNumber, 
      formatDate(b.checkInDate), 
      formatDate(b.checkOutDate), 
      b.rate, 
      b.status, 
      formatDate(b.createdAt)
    ]));
    sendCSV(res, csvData, 'total-bookings');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportActiveBookings = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const bookings = await Booking.find({ deleted: { $ne: true }, status: 'Checked In', ...dateFilter }).select('guestName phoneNumber checkInDate rate roomNumber');
    const csvData = [['Guest Name', 'Phone', 'Check In Date', 'Rate', 'Room Number']];
    bookings.forEach(b => csvData.push([
      b.guestName, 
      b.phoneNumber, 
      formatDate(b.checkInDate), 
      b.rate, 
      b.roomNumber
    ]));
    sendCSV(res, csvData, 'active-bookings');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportCancelledBookings = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const bookings = await Booking.find({ deleted: { $ne: true }, status: 'Cancelled', ...dateFilter }).select('guestName phoneNumber checkInDate rate createdAt');
    const csvData = [['Guest Name', 'Phone', 'Check In Date', 'Rate', 'Cancelled Date']];
    bookings.forEach(b => csvData.push([
      b.guestName, 
      b.phoneNumber, 
      formatDate(b.checkInDate), 
      b.rate, 
      formatDate(b.createdAt)
    ]));
    sendCSV(res, csvData, 'cancelled-bookings');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportRevenue = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const bookings = await Booking.find({ deleted: { $ne: true }, ...dateFilter }).select('guestName rate paymentMode createdAt');
    const csvData = [['Guest Name', 'Amount', 'Payment Mode', 'Date']];
    bookings.forEach(b => csvData.push([
      b.guestName, 
      b.rate, 
      b.paymentMode, 
      formatDate(b.createdAt)
    ]));
    sendCSV(res, csvData, 'revenue-report');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportOnlinePayments = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const bookings = await Booking.find({ deleted: { $ne: true }, paymentMode: /upi|online|card/i, ...dateFilter }).select('guestName rate paymentMode createdAt');
    const csvData = [['Guest Name', 'Amount', 'Payment Mode', 'Date']];
    bookings.forEach(b => csvData.push([
      b.guestName, 
      b.rate, 
      b.paymentMode, 
      formatDate(b.createdAt)
    ]));
    sendCSV(res, csvData, 'online-payments');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportCashPayments = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const bookings = await Booking.find({ deleted: { $ne: true }, paymentMode: /cash/i, ...dateFilter }).select('guestName rate paymentMode createdAt');
    const csvData = [['Guest Name', 'Amount', 'Payment Mode', 'Date']];
    bookings.forEach(b => csvData.push([
      b.guestName, 
      b.rate, 
      b.paymentMode, 
      formatDate(b.createdAt)
    ]));
    sendCSV(res, csvData, 'cash-payments');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportRestaurantOrders = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const orders = await RestaurantOrder.find(dateFilter).select('customerName tableNo amount status createdAt');
    const csvData = [['Customer Name', 'Table No', 'Amount', 'Status', 'Order Date']];
    orders.forEach(o => csvData.push([
      o.customerName, 
      o.tableNo, 
      o.amount, 
      o.status, 
      formatDate(o.createdAt)
    ]));
    sendCSV(res, csvData, 'restaurant-orders');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper functions
function getDateFilter(filter, startDate, endDate) {
  let dateFilter = {};
  const now = new Date();
  
  switch (filter) {
    case 'today':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      };
      break;
    case 'weekly':
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      dateFilter = { createdAt: { $gte: weekStart } };
      break;
    case 'monthly':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        }
      };
      break;
    case 'yearly':
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lt: new Date(now.getFullYear() + 1, 0, 1)
        }
      };
      break;
    case 'range':
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        };
      }
      break;
  }
  return dateFilter;
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

function sendCSV(res, csvData, filename) {
  const csvString = csvData.map(row => 
    row.map(cell => `"${cell || ''}"`).join(',')
  ).join('\n');
  const timestamp = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}-${timestamp}.csv"`);
  res.send(csvString);
}