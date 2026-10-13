const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const {
  AppError,
  asyncHandler,
  sanitizeUser,
  uploadToCloudinary,
  deleteImage,
  applyProviderFields,
  deleteProviderData,
  updateRatings,
} = require('../utils/helpers');

const getProfile = asyncHandler(async (req, res) => {
  const provider =
    req.user.role === 'provider' ? await Provider.findOne({ user: req.user._id }).populate('category', 'name') : null;
  res.json({ success: true, user: sanitizeUser(req.user), provider });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, phone } = req.body;

  if (name !== undefined) {
    if (!String(name).trim()) throw new AppError('Name cannot be empty', 400);
    user.name = String(name).trim();
  }
  if (phone !== undefined) user.phone = String(phone).trim();

  let newImage;
  if (req.file) {
    newImage = await uploadToCloudinary(req.file, 'users');
    await deleteImage(user.profileImage);
    user.profileImage = newImage;
  }
  await user.save();

  let provider = null;
  if (user.role === 'provider') {
    provider = await Provider.findOne({ user: user._id });
    if (provider) {
      provider.name = user.name;
      provider.phone = user.phone;
      if (newImage) provider.profileImage = newImage;
      await applyProviderFields(provider, req.body);
      await provider.save();
      await provider.populate('category', 'name');
    }
  }

  res.json({ success: true, message: 'Profile updated', user: sanitizeUser(user), provider });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Please enter your current and new password', 400);
  if (String(newPassword).length < 6) throw new AppError('New password must be at least 6 characters', 400);

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new AppError('Your current password is incorrect', 400);

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const [bookings, reviews, provider] = await Promise.all([
    Booking.countDocuments({ user: user._id }),
    Review.countDocuments({ user: user._id }),
    Provider.findOne({ user: user._id }).populate('category', 'name'),
  ]);

  res.json({ success: true, user, provider, stats: { bookings, reviews } });
});

const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be deactivated here', 400);

  user.isActive = !user.isActive;
  await user.save();

  if (user.role === 'provider') await Provider.updateOne({ user: user._id }, { isActive: user.isActive });

  res.json({ success: true, message: user.isActive ? 'User activated' : 'User deactivated', user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be deleted', 400);

  const provider = await Provider.findOne({ user: user._id });
  if (provider) {
    await deleteImage(provider.profileImage);
    await deleteProviderData(provider._id);
  }

  const reviews = await Review.find({ user: user._id });
  await Review.deleteMany({ user: user._id });
  await Booking.deleteMany({ user: user._id });
  await Promise.all(reviews.map((review) => updateRatings({ provider: review.provider, service: review.service })));

  await deleteImage(user.profileImage);
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

module.exports = { getProfile, updateProfile, changePassword, getUsers, getUserById, toggleUserActive, deleteUser };
