const Booking = require('../models/Booking');

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
      cancelledBookings,
      cashPayments,
      upiPayments,
      totalRevenue
    ] = await Promise.all([
      Booking.countDocuments(baseQuery),
      Booking.countDocuments({ ...baseQuery, isActive: false }),
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
        cancelledBookings,
        activeBookings: totalBookings - cancelledBookings,
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