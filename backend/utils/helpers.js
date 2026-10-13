const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const Category = require('../models/Category');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

/* ------------------------------ Errors ------------------------------ */

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* -------------------------------- Auth ------------------------------ */

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  profileImage: user.profileImage,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

/* -------------------------------- Text ------------------------------ */

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ------------------------------- Images ----------------------------- */

const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return reject(new AppError('Image upload is not set up yet. Add your Cloudinary keys to backend/.env', 500));
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: `servicehub/${folder}`, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(new AppError('Image upload failed. Please try again.', 502));
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });

const deleteImage = async (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    if (match) await cloudinary.uploader.destroy(match[1]);
  } catch (error) {
    console.error('Could not delete old image:', error.message);
  }
};

/* ---------------------------- Dates and slots ------------------------ */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const isValidDateString = (dateStr) =>
  DATE_REGEX.test(dateStr) && !Number.isNaN(new Date(`${dateStr}T00:00:00Z`).getTime());

const getDayName = (dateStr) => DAYS[new Date(`${dateStr}T00:00:00Z`).getUTCDay()];

const isPastDate = (dateStr) => {
  const limit = new Date();
  limit.setUTCDate(limit.getUTCDate() - 1);
  return dateStr < limit.toISOString().slice(0, 10);
};

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const pad = (n) => String(n).padStart(2, '0');

const generateTimeSlots = (start = '09:00', end = '18:00') => {
  const slots = [];
  for (let m = toMinutes(start); m + 60 <= toMinutes(end); m += 60) {
    slots.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
  }
  return slots;
};

/* ------------------------------ Ratings ------------------------------ */

const averageFor = async (field, id) => {
  const [stats] = await Review.aggregate([
    { $match: { [field]: new mongoose.Types.ObjectId(id) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  return { rating: stats ? Math.round(stats.average * 10) / 10 : 0, count: stats ? stats.count : 0 };
};

const updateRatings = async ({ provider, service }) => {
  if (provider) {
    const { rating, count } = await averageFor('provider', provider);
    await Provider.findByIdAndUpdate(provider, { rating, reviewCount: count });
  }
  if (service) {
    const { rating, count } = await averageFor('service', service);
    await Service.findByIdAndUpdate(service, { rating, numReviews: count });
  }
};

/* ------------------------------ Providers ---------------------------- */

const applyProviderFields = async (provider, body) => {
  if (body.bio !== undefined) provider.bio = body.bio;
  if (body.location !== undefined && String(body.location).trim()) provider.location = String(body.location).trim();
  if (body.experience !== undefined && body.experience !== '') provider.experience = Number(body.experience);

  if (body.category && String(body.category) !== String(provider.category)) {
    const exists = await Category.exists({ _id: body.category });
    if (!exists) throw new AppError('Category not found', 400);
    provider.category = body.category;
  }

  if (body.availabilityDays !== undefined) {
    const days = String(body.availabilityDays)
      .split(',')
      .map((d) => d.trim())
      .filter((d) => DAYS.includes(d));
    if (days.length === 0) throw new AppError('Choose at least one working day', 400);
    provider.set('availability.days', days);
  }

  if (body.startTime || body.endTime) {
    const start = body.startTime || provider.availability.startTime;
    const end = body.endTime || provider.availability.endTime;
    if (!TIME_REGEX.test(start) || !TIME_REGEX.test(end)) throw new AppError('Working hours must look like HH:MM', 400);
    if (toMinutes(start) + 60 > toMinutes(end)) throw new AppError('Working hours must cover at least one hour', 400);
    provider.set('availability.startTime', start);
    provider.set('availability.endTime', end);
  }
};

const deleteProviderData = async (providerId) => {
  const services = await Service.find({ provider: providerId }).select('image');
  await Promise.all(services.map((service) => deleteImage(service.image)));
  await Service.deleteMany({ provider: providerId });
  await Booking.deleteMany({ provider: providerId });
  await Review.deleteMany({ provider: providerId });
  await Provider.findByIdAndDelete(providerId);
};

module.exports = {
  AppError,
  asyncHandler,
  generateToken,
  sanitizeUser,
  escapeRegex,
  uploadToCloudinary,
  deleteImage,
  DAYS,
  DATE_REGEX,
  TIME_REGEX,
  isValidDateString,
  getDayName,
  isPastDate,
  generateTimeSlots,
  updateRatings,
  applyProviderFields,
  deleteProviderData,
};
