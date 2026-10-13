const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../utils/helpers');

const getMonthlyCounts = async (Model) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  const rows = await Model.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
  ]);

  const series = [];
  for (let i = 5; i >= 0; i -= 1) {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const row = rows.find((r) => r._id.year === monthDate.getUTCFullYear() && r._id.month === monthDate.getUTCMonth() + 1);
    series.push({
      label: monthDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
      count: row ? row.count : 0,
    });
  }
  return series;
};

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProviders,
    totalServices,
    totalBookings,
    pendingProviders,
    completedBookings,
    bookingsByMonth,
    usersByMonth,
    popularServices,
    statusRows,
    recentBookings,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    Provider.countDocuments(),
    Service.countDocuments(),
    Booking.countDocuments(),
    Provider.countDocuments({ approvalStatus: 'pending' }),
    Booking.countDocuments({ status: 'completed' }),
    getMonthlyCounts(Booking),
    getMonthlyCounts(User),
    Booking.aggregate([
      { $group: { _id: '$service', bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      { $project: { _id: 0, title: '$service.title', bookings: 1 } },
    ]),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.find()
      .populate('user', 'name')
      .populate('provider', 'name')
      .populate('service', 'title')
      .sort({ createdAt: -1 })
      .limit(6),
  ]);

  res.json({
    success: true,
    stats: { totalUsers, totalProviders, totalServices, totalBookings, pendingProviders, completedBookings },
    charts: {
      bookingsByMonth,
      usersByMonth,
      popularServices,
      bookingsByStatus: statusRows.map((row) => ({ status: row._id, count: row.count })),
    },
    recentBookings,
  });
});

module.exports = { getDashboardStats };
