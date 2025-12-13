const Booking = require('../models/Booking');
const RestaurantOrder = require('../models/RestaurantOrder');
const Laundry = require('../models/Laundry');

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
      totalRevenue,
      laundryOrders
    ] = await Promise.all([
      Booking.countDocuments(baseQuery),
      Booking.countDocuments({ ...baseQuery, status: 'Checked In' }),
      Booking.countDocuments({ ...baseQuery, status: 'Cancelled' }),
      Booking.countDocuments({ ...baseQuery, paymentMode: /cash/i }),
      Booking.countDocuments({ ...baseQuery, paymentMode: /upi/i }),
      Booking.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, total: { $sum: '$rate' } } }
      ]),
      Laundry.countDocuments(baseQuery)
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
        totalRevenue: totalRevenue[0]?.total || 0,
        laundryOrders
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
      restaurantOrders,
      laundryOrders
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
      RestaurantOrder.countDocuments(restaurantQuery),
      Laundry.countDocuments(bookingQuery)
    ]);

    // Create CSV data with individual metrics
    const csvData = [
      ['Metric', 'Count', 'Amount'],
      ['Total Bookings', totalBookings, `Rs.${totalRevenue[0]?.total || 0}`],
      ['Active Bookings', activeBookings, ''], 
      ['Cancelled Bookings', cancelledBookings, ''],
      ['Online Payments', onlinePayments, ''],
      ['Cash Payments', cashPayments, ''],
      ['Restaurant Orders', restaurantOrders, ''],
      ['Laundry Orders', laundryOrders, ''],
      ['', '', ''],
      ['SUMMARY', '', ''],
      ['Total Revenue', '', `Rs.${totalRevenue[0]?.total || 0}`],
      ['Total Orders (All Services)', totalBookings + restaurantOrders + laundryOrders, ''],
      ['Payment Breakdown:', '', ''],
      ['- Online Payments', onlinePayments, ''],
      ['- Cash Payments', cashPayments, '']
    ];

    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(cell => `"${cell || ''}"`).join(',')
    ).join('\n');

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
    const bookings = await Booking.find({ deleted: { $ne: true }, ...dateFilter }).select('name mobileNo checkInDate checkOutDate rate status createdAt');
    const csvData = [['Guest Name', 'Phone', 'Check In', 'Check Out', 'Rate', 'Status', 'Booking Date']];
    let totalAmount = 0;
    bookings.forEach(b => {
      csvData.push([
        b.name, 
        b.mobileNo, 
        formatDate(b.checkInDate), 
        formatDate(b.checkOutDate), 
        b.rate, 
        b.status, 
        formatDate(b.createdAt)
      ]);
      totalAmount += (b.rate || 0);
    });
    // Add total rows
    csvData.push(['', '', '', '', '', '', '']);
    csvData.push(['TOTAL BOOKINGS:', bookings.length, '', '', '', '', '']);
    csvData.push(['TOTAL AMOUNT:', '', '', '', `Rs.${totalAmount}`, '', '']);
    sendCSV(res, csvData, 'total-bookings');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportActiveBookings = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const bookings = await Booking.find({ deleted: { $ne: true }, status: 'Checked In', ...dateFilter }).select('name mobileNo checkInDate rate roomNumber');
    const csvData = [['Guest Name', 'Phone', 'Check In Date', 'Rate', 'Room Number']];
    let totalAmount = 0;
    bookings.forEach(b => {
      csvData.push([
        b.name, 
        b.mobileNo, 
        formatDate(b.checkInDate), 
        b.rate, 
        b.roomNumber
      ]);
      totalAmount += (b.rate || 0);
    });
    // Add total row
    csvData.push(['', '', '', '', '']);
    csvData.push(['TOTAL ACTIVE BOOKINGS:', bookings.length, '', `Rs.${totalAmount}`, '']);
    sendCSV(res, csvData, 'active-bookings');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportCancelledBookings = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const bookings = await Booking.find({ deleted: { $ne: true }, status: 'Cancelled', ...dateFilter }).select('name mobileNo checkInDate rate createdAt');
    const csvData = [['Guest Name', 'Phone', 'Check In Date', 'Rate', 'Cancelled Date']];
    let totalAmount = 0;
    bookings.forEach(b => {
      csvData.push([
        b.name, 
        b.mobileNo, 
        formatDate(b.checkInDate), 
        b.rate, 
        formatDate(b.createdAt)
      ]);
      totalAmount += (b.rate || 0);
    });
    // Add total row
    csvData.push(['', '', '', '', '']);
    csvData.push(['TOTAL CANCELLED BOOKINGS:', bookings.length, '', `Rs.${totalAmount}`, '']);
    sendCSV(res, csvData, 'cancelled-bookings');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportRevenue = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const bookings = await Booking.find({ deleted: { $ne: true }, ...dateFilter }).select('name rate paymentMode createdAt');
    const csvData = [['Guest Name', 'Amount', 'Payment Mode', 'Date']];
    let totalRevenue = 0;
    bookings.forEach(b => {
      csvData.push([
        b.name, 
        b.rate, 
        b.paymentMode, 
        formatDate(b.createdAt)
      ]);
      totalRevenue += (b.rate || 0);
    });
    // Add total row
    csvData.push(['', '', '', '']);
    csvData.push(['TOTAL REVENUE:', `Rs.${totalRevenue}`, '', '']);
    sendCSV(res, csvData, 'revenue-report');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportOnlinePayments = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const bookings = await Booking.find({ deleted: { $ne: true }, paymentMode: /upi|online|card/i, ...dateFilter }).select('name rate paymentMode createdAt');
    const csvData = [['Guest Name', 'Amount', 'Payment Mode', 'Date']];
    let totalAmount = 0;
    bookings.forEach(b => {
      csvData.push([
        b.name, 
        b.rate, 
        b.paymentMode, 
        formatDate(b.createdAt)
      ]);
      totalAmount += (b.rate || 0);
    });
    // Add total row
    csvData.push(['', '', '', '']);
    csvData.push(['TOTAL ONLINE PAYMENTS:', `Rs.${totalAmount}`, '', '']);
    sendCSV(res, csvData, 'online-payments');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportCashPayments = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const bookings = await Booking.find({ deleted: { $ne: true }, paymentMode: /cash/i, ...dateFilter }).select('name rate paymentMode createdAt');
    const csvData = [['Guest Name', 'Amount', 'Payment Mode', 'Date']];
    let totalAmount = 0;
    bookings.forEach(b => {
      csvData.push([
        b.name, 
        b.rate, 
        b.paymentMode, 
        formatDate(b.createdAt)
      ]);
      totalAmount += (b.rate || 0);
    });
    // Add total row
    csvData.push(['', '', '', '']);
    csvData.push(['TOTAL CASH PAYMENTS:', `Rs.${totalAmount}`, '', '']);
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
    let totalAmount = 0;
    orders.forEach(o => {
      csvData.push([
        o.customerName, 
        o.tableNo, 
        o.amount, 
        o.status, 
        formatDate(o.createdAt)
      ]);
      totalAmount += (o.amount || 0);
    });
    // Add total row
    csvData.push(['', '', '', '', '']);
    csvData.push(['TOTAL RESTAURANT ORDERS:', orders.length, `Rs.${totalAmount}`, '', '']);
    sendCSV(res, csvData, 'restaurant-orders');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportLaundryOrders = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filter, startDate, endDate);
    const orders = await Laundry.find(dateFilter).select('roomNumber grcNo requestedByName laundryStatus serviceType totalAmount items createdAt invoiceNumber');
    const csvData = [['Invoice Number', 'Room Number', 'GRC No', 'Requested By', 'Status', 'Service Type', 'Total Amount', 'Items Count', 'Order Date']];
    let totalAmount = 0;
    let totalItems = 0;
    orders.forEach(o => {
      csvData.push([
        o.invoiceNumber || '',
        o.roomNumber || '', 
        o.grcNo || '', 
        o.requestedByName || '', 
        o.laundryStatus || '', 
        o.serviceType || '',
        o.totalAmount || 0,
        o.items?.length || 0,
        formatDate(o.createdAt)
      ]);
      totalAmount += (o.totalAmount || 0);
      totalItems += (o.items?.length || 0);
    });
    // Add total row
    csvData.push(['', '', '', '', '', '', '', '', '']);
    csvData.push(['TOTAL LAUNDRY ORDERS:', orders.length, '', '', '', '', `Rs.${totalAmount}`, totalItems, '']);
    sendCSV(res, csvData, 'laundry-orders');
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