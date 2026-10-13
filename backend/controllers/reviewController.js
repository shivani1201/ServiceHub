const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { AppError, asyncHandler, updateRatings } = require('../utils/helpers');

const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('user', 'name email profileImage')
    .populate('provider', 'name')
    .populate('service', 'title')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, reviews });
});

const getProviderReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ provider: req.params.providerId })
    .populate('user', 'name profileImage')
    .populate('service', 'title')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, reviews });
});

const getServiceReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ service: req.params.serviceId })
    .populate('user', 'name profileImage')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: reviews.length, reviews });
});

const createReview = asyncHandler(async (req, res) => {
  const { booking: bookingId, rating, comment } = req.body;
  if (!bookingId || rating === undefined) throw new AppError('Please choose a booking and a rating', 400);

  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new AppError('Rating must be a whole number from 1 to 5', 400);

  const booking = await Booking.findById(bookingId);
  if (!booking || !booking.user.equals(req.user._id)) throw new AppError('Booking not found', 404);
  if (booking.status !== 'completed') throw new AppError('You can only review a completed booking', 400);
  if (booking.isReviewed) throw new AppError('You have already reviewed this booking', 409);

  const review = await Review.create({
    user: req.user._id,
    provider: booking.provider,
    service: booking.service,
    booking: booking._id,
    rating: stars,
    comment: comment ? String(comment).trim() : '',
  });

  booking.isReviewed = true;
  await booking.save();
  await updateRatings({ provider: booking.provider, service: booking.service });

  res.status(201).json({ success: true, message: 'Thanks for your review', review });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  const isAuthor = review.user.equals(req.user._id);
  if (!isAuthor && req.user.role !== 'admin') throw new AppError('You are not allowed to delete this review', 403);

  await review.deleteOne();
  await Booking.findByIdAndUpdate(review.booking, { isReviewed: false });
  await updateRatings({ provider: review.provider, service: review.service });

  res.json({ success: true, message: 'Review removed' });
});

module.exports = { getAllReviews, getProviderReviews, getServiceReviews, createReview, deleteReview };
