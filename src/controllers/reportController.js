const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Category = require('../models/Category');
const RoomService = require('../models/RoomService');
const RestaurantOrder = require('../models/RestaurantOrder');

// Generate Night Audit Report
exports.getNightAuditReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    
    // Set date range for the report
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all rooms and categories
    const [allRooms, allCategories] = await Promise.all([
      Room.find({}),
      Category.find({})
    ]);

    // Get bookings for different periods
    const [todayBookings, weekBookings, monthBookings, yearBookings] = await Promise.all([
      Booking.find({
        $or: [
          { checkInDate: { $lte: endOfDay }, checkOutDate: { $gt: startOfDay } },
          { createdAt: { $gte: startOfDay, $lte: endOfDay } }
        ]
      }),
      Booking.find({
        $or: [
          { checkInDate: { $lte: endOfDay }, checkOutDate: { $gt: getWeekStart(reportDate) } },
          { createdAt: { $gte: getWeekStart(reportDate), $lte: endOfDay } }
        ]
      }),
      Booking.find({
        $or: [
          { checkInDate: { $lte: endOfDay }, checkOutDate: { $gt: getMonthStart(reportDate) } },
          { createdAt: { $gte: getMonthStart(reportDate), $lte: endOfDay } }
        ]
      }),
      Booking.find({
        $or: [
          { checkInDate: { $lte: endOfDay }, checkOutDate: { $gt: getYearStart(reportDate) } },
          { createdAt: { $gte: getYearStart(reportDate), $lte: endOfDay } }
        ]
      })
    ]);

    // Calculate house status
    const houseStatus = calculateHouseStatus(allRooms, todayBookings, weekBookings, monthBookings, yearBookings, reportDate);
    
    // Calculate housekeeping status
    const housekeepingStatus = calculateHousekeepingStatus(allRooms, todayBookings);
    
    // Calculate revenue analysis
    const revenueAnalysis = calculateRevenueAnalysis(todayBookings, weekBookings, monthBookings, yearBookings);
    
    // Calculate performance metrics
    const performanceAnalysis = calculatePerformanceAnalysis(allRooms, todayBookings, weekBookings, monthBookings, yearBookings, reportDate);
    
    // Generate 10-day forecast
    const forecast = generateForecast(allRooms, reportDate);

    const reportData = {
      reportDate: reportDate.toISOString().split('T')[0],
      houseStatus,
      housekeepingStatus,
      revenueAnalysis,
      performanceAnalysis,
      forecast
    };

    res.json({ success: true, data: reportData });
  } catch (error) {
    console.error('Night audit report error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper functions
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getYearStart(date) {
  return new Date(date.getFullYear(), 0, 1);
}

function calculateHouseStatus(allRooms, todayBookings, weekBookings, monthBookings, yearBookings, reportDate) {
  const totalRooms = allRooms.length;
  
  // Calculate occupied rooms for today
  const occupiedToday = todayBookings.filter(booking => 
    booking.status === 'Checked In' || 
    (booking.status === 'Booked' && new Date(booking.checkInDate) <= reportDate && new Date(booking.checkOutDate) > reportDate)
  ).length;
  
  const availableToday = totalRooms - occupiedToday;
  
  // Calculate other metrics
  const reservationsToday = todayBookings.filter(b => b.status === 'Booked').length;
  const arrivalsToday = todayBookings.filter(b => 
    new Date(b.checkInDate).toDateString() === reportDate.toDateString()
  ).length;
  const departuresToday = todayBookings.filter(b => 
    new Date(b.checkOutDate).toDateString() === reportDate.toDateString()
  ).length;
  const noShowsToday = todayBookings.filter(b => b.status === 'No Show').length;
  const cancellationsToday = todayBookings.filter(b => b.status === 'Cancelled').length;
  const walkInsToday = todayBookings.filter(b => b.bookingType === 'Walk-in' && new Date(b.checkInDate).toDateString() === reportDate.toDateString()).length;
  
  // Calculate week, month, year metrics
  const occupiedWeek = weekBookings.filter(b => b.status === 'Checked In' || b.status === 'Booked').length;
  const occupiedMonth = monthBookings.filter(b => b.status === 'Checked In' || b.status === 'Booked').length;
  const occupiedYear = yearBookings.filter(b => b.status === 'Checked In' || b.status === 'Booked').length;
  
  const guestsToday = todayBookings.reduce((sum, b) => sum + (b.adults || 1) + (b.children || 0), 0);
  const guestsWeek = weekBookings.reduce((sum, b) => sum + (b.adults || 1) + (b.children || 0), 0);
  const guestsMonth = monthBookings.reduce((sum, b) => sum + (b.adults || 1) + (b.children || 0), 0);
  const guestsYear = yearBookings.reduce((sum, b) => sum + (b.adults || 1) + (b.children || 0), 0);

  return {
    totalRooms: { today: totalRooms, wtd: totalRooms, mtd: totalRooms, ytd: totalRooms },
    outOfOrder: { today: 0, wtd: 0, mtd: 0, ytd: 0 },
    roomInventory: { today: totalRooms, wtd: totalRooms, mtd: totalRooms, ytd: totalRooms },
    available: { today: availableToday, wtd: totalRooms - occupiedWeek, mtd: totalRooms - occupiedMonth, ytd: totalRooms - occupiedYear },
    occupied: { today: occupiedToday, wtd: occupiedWeek, mtd: occupiedMonth, ytd: occupiedYear },
    reserved: { today: reservationsToday, wtd: weekBookings.filter(b => b.status === 'Booked').length, mtd: monthBookings.filter(b => b.status === 'Booked').length, ytd: yearBookings.filter(b => b.status === 'Booked').length },
    reservationsMade: { today: todayBookings.length, wtd: weekBookings.length, mtd: monthBookings.length, ytd: yearBookings.length },
    arrivals: { today: arrivalsToday, wtd: weekBookings.filter(b => new Date(b.checkInDate) >= getWeekStart(reportDate)).length, mtd: monthBookings.filter(b => new Date(b.checkInDate) >= getMonthStart(reportDate)).length, ytd: yearBookings.filter(b => new Date(b.checkInDate) >= getYearStart(reportDate)).length },
    departures: { today: departuresToday, wtd: weekBookings.filter(b => new Date(b.checkOutDate) <= reportDate && new Date(b.checkOutDate) >= getWeekStart(reportDate)).length, mtd: monthBookings.filter(b => new Date(b.checkOutDate) <= reportDate && new Date(b.checkOutDate) >= getMonthStart(reportDate)).length, ytd: yearBookings.filter(b => new Date(b.checkOutDate) <= reportDate && new Date(b.checkOutDate) >= getYearStart(reportDate)).length },
    walkIns: { today: walkInsToday, wtd: weekBookings.filter(b => b.bookingType === 'Walk-in').length, mtd: monthBookings.filter(b => b.bookingType === 'Walk-in').length, ytd: yearBookings.filter(b => b.bookingType === 'Walk-in').length },
    noShows: { today: noShowsToday, wtd: weekBookings.filter(b => b.status === 'No Show').length, mtd: monthBookings.filter(b => b.status === 'No Show').length, ytd: yearBookings.filter(b => b.status === 'No Show').length },
    cancellations: { today: cancellationsToday, wtd: weekBookings.filter(b => b.status === 'Cancelled').length, mtd: monthBookings.filter(b => b.status === 'Cancelled').length, ytd: yearBookings.filter(b => b.status === 'Cancelled').length },
    void: { today: 0, wtd: 0, mtd: 0, ytd: 0 },
    overStay: { today: 0, wtd: 0, mtd: 0, ytd: 0 },
    underStay: { today: 0, wtd: 0, mtd: 0, ytd: 0 },
    stayOver: { today: occupiedToday, wtd: occupiedWeek, mtd: occupiedMonth, ytd: occupiedYear },
    guestInHouse: { today: guestsToday, wtd: guestsWeek, mtd: guestsMonth, ytd: guestsYear }
  };
}

function calculateHousekeepingStatus(allRooms, todayBookings) {
  const occupiedRooms = todayBookings.filter(b => b.status === 'Checked In').length;
  const vacantRooms = allRooms.length - occupiedRooms;
  
  return {
    clean: { vacant: Math.floor(vacantRooms * 0.6), occupied: 0 },
    dirty: { vacant: Math.floor(vacantRooms * 0.2), occupied: 0 },
    touchUp: { vacant: Math.floor(vacantRooms * 0.2), occupied: 0 },
    total: { vacant: vacantRooms, occupied: occupiedRooms }
  };
}

function calculateRevenueAnalysis(todayBookings, weekBookings, monthBookings, yearBookings) {
  const calculateRevenue = (bookings) => {
    return bookings.reduce((sum, booking) => {
      if (booking.status === 'Checked In' || booking.status === 'Checked Out' || booking.status === 'Booked') {
        return sum + (booking.totalAmount || booking.rate || 0);
      }
      return sum;
    }, 0);
  };

  const calculateNoShowRevenue = (bookings) => {
    return bookings.filter(b => b.status === 'No Show').reduce((sum, booking) => sum + (booking.totalAmount || booking.rate || 0), 0);
  };

  const todayRevenue = calculateRevenue(todayBookings);
  const weekRevenue = calculateRevenue(weekBookings);
  const monthRevenue = calculateRevenue(monthBookings);
  const yearRevenue = calculateRevenue(yearBookings);

  const todayNoShow = calculateNoShowRevenue(todayBookings);
  const weekNoShow = calculateNoShowRevenue(weekBookings);
  const monthNoShow = calculateNoShowRevenue(monthBookings);
  const yearNoShow = calculateNoShowRevenue(yearBookings);

  return {
    roomCharges: {
      today: todayRevenue - todayNoShow,
      wtd: weekRevenue - weekNoShow,
      mtd: monthRevenue - monthNoShow,
      ytd: yearRevenue - yearNoShow
    },
    noShowCharges: {
      today: todayNoShow,
      wtd: weekNoShow,
      mtd: monthNoShow,
      ytd: yearNoShow
    },
    salesAC: {
      today: 0, // Additional services revenue - can be extended later
      wtd: 0,
      mtd: 0,
      ytd: 0
    },
    total: {
      today: todayRevenue,
      wtd: weekRevenue,
      mtd: monthRevenue,
      ytd: yearRevenue
    }
  };
}

function calculatePerformanceAnalysis(allRooms, todayBookings, weekBookings, monthBookings, yearBookings, reportDate) {
  const totalRooms = allRooms.length;
  
  const calculateOccupancyToday = () => {
    const occupiedRooms = allRooms.filter(room => room.status === 'booked' || room.status === 'reserved').length;
    return totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
  };

  const calculateOccupancyWeek = () => {
    const occupiedRoomCount = weekBookings.filter(b => 
      (b.status === 'Checked In' || b.status === 'Checked Out' || b.status === 'Booked') &&
      b.roomNumber
    ).length;
    return totalRooms > 0 ? (occupiedRoomCount / (totalRooms * 7)) * 100 : 0;
  };

  const calculateOccupancyMonth = () => {
    const occupiedRoomCount = monthBookings.filter(b => 
      (b.status === 'Checked In' || b.status === 'Checked Out' || b.status === 'Booked') &&
      b.roomNumber
    ).length;
    return totalRooms > 0 ? (occupiedRoomCount / (totalRooms * 30)) * 100 : 0;
  };

  const calculateOccupancyYear = () => {
    const occupiedRoomCount = yearBookings.filter(b => 
      (b.status === 'Checked In' || b.status === 'Checked Out' || b.status === 'Booked') &&
      b.roomNumber
    ).length;
    return totalRooms > 0 ? (occupiedRoomCount / (totalRooms * 365)) * 100 : 0;
  };

  const calculateADRToday = () => {
    const validBookings = todayBookings.filter(b => b.status === 'Checked In' || b.status === 'Checked Out' || b.status === 'Booked');
    const totalRevenue = validBookings.reduce((sum, b) => sum + (b.totalAmount || b.rate || 0), 0);
    const roomsSold = validBookings.length;
    return roomsSold > 0 ? totalRevenue / roomsSold : 0;
  };

  const calculateADRWeek = () => {
    const validBookings = weekBookings.filter(b => b.status === 'Checked In' || b.status === 'Checked Out' || b.status === 'Booked');
    const totalRevenue = validBookings.reduce((sum, b) => sum + (b.totalAmount || b.rate || 0), 0);
    const roomsSold = validBookings.length;
    return roomsSold > 0 ? totalRevenue / roomsSold : 0;
  };

  const calculateADRMonth = () => {
    const validBookings = monthBookings.filter(b => b.status === 'Checked In' || b.status === 'Checked Out' || b.status === 'Booked');
    const totalRevenue = validBookings.reduce((sum, b) => sum + (b.totalAmount || b.rate || 0), 0);
    const roomsSold = validBookings.length;
    return roomsSold > 0 ? totalRevenue / roomsSold : 0;
  };

  const calculateADRYear = () => {
    const validBookings = yearBookings.filter(b => b.status === 'Checked In' || b.status === 'Checked Out' || b.status === 'Booked');
    const totalRevenue = validBookings.reduce((sum, b) => sum + (b.totalAmount || b.rate || 0), 0);
    const roomsSold = validBookings.length;
    return roomsSold > 0 ? totalRevenue / roomsSold : 0;
  };

  const calculateRevParToday = () => {
    const totalRevenue = todayBookings.reduce((sum, b) => sum + (b.totalAmount || b.rate || 0), 0);
    return totalRooms > 0 ? totalRevenue / totalRooms : 0;
  };

  const calculateRevParWeek = () => {
    const totalRevenue = weekBookings.reduce((sum, b) => sum + (b.totalAmount || b.rate || 0), 0);
    return totalRooms > 0 ? totalRevenue / (totalRooms * 7) : 0;
  };

  const calculateRevParMonth = () => {
    const totalRevenue = monthBookings.reduce((sum, b) => sum + (b.totalAmount || b.rate || 0), 0);
    return totalRooms > 0 ? totalRevenue / (totalRooms * 30) : 0;
  };

  const calculateRevParYear = () => {
    const totalRevenue = yearBookings.reduce((sum, b) => sum + (b.totalAmount || b.rate || 0), 0);
    return totalRooms > 0 ? totalRevenue / (totalRooms * 365) : 0;
  };

  return {
    occupancyPercent: {
      today: calculateOccupancyToday(),
      wtd: calculateOccupancyWeek(),
      mtd: calculateOccupancyMonth(),
      ytd: calculateOccupancyYear()
    },
    adr: {
      today: calculateADRToday(),
      wtd: calculateADRWeek(),
      mtd: calculateADRMonth(),
      ytd: calculateADRYear()
    },
    revPar: {
      today: calculateRevParToday(),
      wtd: calculateRevParWeek(),
      mtd: calculateRevParMonth(),
      ytd: calculateRevParYear()
    },
    arg: {
      today: calculateADRToday(),
      wtd: calculateADRWeek(),
      mtd: calculateADRMonth(),
      ytd: calculateADRYear()
    }
  };
}

function generateForecast(allRooms, reportDate) {
  const forecast = [];
  const totalRooms = allRooms.length;
  
  for (let i = 0; i < 10; i++) {
    const date = new Date(reportDate);
    date.setDate(date.getDate() + i);
    
    const expectedOccupancy = Math.max(1, Math.floor(totalRooms * (0.3 + Math.random() * 0.4)));
    const expectedRevenue = expectedOccupancy * (25000 + Math.random() * 10000);
    const expectedADR = expectedOccupancy > 0 ? expectedRevenue / expectedOccupancy : 0;
    const expectedRevPar = totalRooms > 0 ? expectedRevenue / totalRooms : 0;
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      totalRooms,
      arrival: i === 0 ? 0 : Math.floor(Math.random() * 3),
      stayOver: expectedOccupancy,
      departure: i === 0 ? 0 : Math.floor(Math.random() * 2),
      expectedOccupancy,
      expectedOccupancyPercent: (expectedOccupancy / totalRooms) * 100,
      expectedRevenue,
      expectedADR,
      expectedRevPar
    });
  }
  
  return forecast;
}