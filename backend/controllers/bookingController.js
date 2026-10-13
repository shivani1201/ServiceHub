const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Provider = require('../models/Provider');
const {
  AppError,
  asyncHandler,
  TIME_REGEX,
  isValidDateString,
  isPastDate,
  getDayName,
  generateTimeSlots,
} = require('../utils/helpers');

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

const PROVIDER_TRANSITIONS = {
  pending: ['confirmed', 'rejected'],
  confirmed: ['completed', 'cancelled'],
};

const customerView = [
  { path: 'service', select: 'title price duration image' },
  { path: 'provider', select: 'name profileImage phone location' },
];
const providerView = [
  { path: 'user', select: 'name email phone profileImage' },
  { path: 'service', select: 'title price duration' },
];
const adminView = [
  { path: 'user', select: 'name email phone' },
  { path: 'provider', select: 'name phone' },
  { path: 'service', select: 'title price duration' },
];

const getOwnProvider = (user) => Provider.findOne({ user: user._id });

const createBooking = asyncHandler(async (req, res) => {
  const { service: serviceId, date, time, address, notes } = req.body;

  if (!serviceId || !date || !time || !address || !String(address).trim()) {
    throw new AppError('Please choose a service, date and time and enter your address', 400);
  }
  if (!isValidDateString(date)) throw new AppError('Date must look like YYYY-MM-DD', 400);
  if (!TIME_REGEX.test(time)) throw new AppError('Time must look like HH:MM', 400);
  if (isPastDate(date)) throw new AppError('You cannot book a date in the past', 400);

  const service = await Service.findById(serviceId).populate('provider');
  if (!service || !service.isAvailable || !service.provider) throw new AppError('This service is not available', 404);

  const provider = service.provider;
  if (!provider.isApproved || !provider.isActive) throw new AppError('This provider is not taking bookings right now', 400);
  if (provider.user && provider.user.equals(req.user._id)) throw new AppError('You cannot book your own service', 400);

  const dayName = getDayName(date);
  if (!provider.availability.days.includes(dayName)) {
    throw new AppError(`${provider.name} does not work on ${dayName}s. Please pick another day.`, 400);
  }
  const slots = generateTimeSlots(provider.availability.startTime, provider.availability.endTime);
  if (!slots.includes(time)) throw new AppError('That time is outside the working hours of this provider', 400);

  const clash = await Booking.findOne({ provider: provider._id, date, time, status: { $in: ['pending', 'confirmed'] } });
  if (clash) throw new AppError('Someone just booked that time. Please pick another slot.', 409);

  const booking = await Booking.create({
    user: req.user._id,
    provider: provider._id,
    service: service._id,
    date,
    time,
    address,
    notes: notes || '',
    price: service.price,
  });

  await booking.populate(customerView);
  res.status(201).json({ success: true, message: 'Booking request sent', booking });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate(customerView).sort({ date: -1, time: -1 });
  res.json({ success: true, count: bookings.length, bookings });
});

const getProviderBookings = asyncHandler(async (req, res) => {
  const provider = await getOwnProvider(req.user);
  if (!provider) throw new AppError('Provider profile not found', 404);

  const bookings = await Booking.find({ provider: provider._id }).populate(providerView).sort({ date: -1, time: -1 });
  res.json({ success: true, count: bookings.length, bookings });
});

const getAllBookings = asyncHandler(async (req, res) => {
  const filter = {};
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status;

  const bookings = await Booking.find(filter).populate(adminView).sort({ createdAt: -1 });
  res.json({ success: true, count: bookings.length, bookings });
});

const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate([
    { path: 'user', select: 'name email phone' },
    { path: 'provider', select: 'name phone location profileImage' },
    { path: 'service', select: 'title price duration image' },
  ]);
  if (!booking) throw new AppError('Booking not found', 404);

  const isOwner = booking.user && booking.user._id.equals(req.user._id);
  let isProviderOfBooking = false;
  if (req.user.role === 'provider' && booking.provider) {
    const provider = await getOwnProvider(req.user);
    isProviderOfBooking = Boolean(provider) && booking.provider._id.equals(provider._id);
  }
  if (!isOwner && !isProviderOfBooking && req.user.role !== 'admin') {
    throw new AppError('You are not allowed to view this booking', 403);
  }

  res.json({ success: true, booking });
});

const updateBooking = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) throw new AppError(`Status must be one of: ${STATUSES.join(', ')}`, 400);

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found', 404);

  const isOwner = booking.user.equals(req.user._id);
  let isProviderOfBooking = false;
  if (req.user.role === 'provider') {
    const provider = await getOwnProvider(req.user);
    isProviderOfBooking = Boolean(provider) && booking.provider.equals(provider._id);
  }

  if (req.user.role === 'admin') {
    // admins may set any status
  } else if (isProviderOfBooking) {
    const allowed = PROVIDER_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(status)) {
      throw new AppError(`A ${booking.status} booking cannot be changed to ${status}`, 400);
    }
  } else if (isOwner) {
    if (status !== 'cancelled') throw new AppError('You can only cancel your own booking', 403);
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new AppError(`A ${booking.status} booking can no longer be cancelled`, 400);
    }
  } else {
    throw new AppError('You are not allowed to update this booking', 403);
  }

  booking.status = status;
  await booking.save();
  await booking.populate(req.user.role === 'admin' ? adminView : isProviderOfBooking ? providerView : customerView);

  res.json({ success: true, message: `Booking marked as ${status}`, booking });
});

const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found', 404);

  const isAdmin = req.user.role === 'admin';
  const isOwner = booking.user.equals(req.user._id);
  if (!isAdmin) {
    if (!isOwner) throw new AppError('You are not allowed to delete this booking', 403);
    if (!['cancelled', 'rejected'].includes(booking.status)) {
      throw new AppError('Cancel the booking first. Only cancelled or rejected bookings can be removed.', 400);
    }
  }

  await booking.deleteOne();
  res.json({ success: true, message: 'Booking deleted' });
});

module.exports = {
  createBooking,
  getMyBookings,
  getProviderBookings,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
