const Provider = require('../models/Provider');
const User = require('../models/User');
const Booking = require('../models/Booking');
const {
  AppError,
  asyncHandler,
  escapeRegex,
  uploadToCloudinary,
  deleteImage,
  isValidDateString,
  getDayName,
  generateTimeSlots,
  applyProviderFields,
  deleteProviderData,
} = require('../utils/helpers');

const PRIVATE_FIELDS = '-user -email -phone -approvalStatus';

const getProviders = asyncHandler(async (req, res) => {
  const { category, search, sort, limit } = req.query;

  const filter = { isApproved: true, isActive: true };
  if (category) filter.category = category;
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: regex }, { location: regex }, { bio: regex }];
  }

  const sortOptions = { experience: { experience: -1 }, newest: { createdAt: -1 } };
  const sortBy = sortOptions[sort] || { rating: -1, reviewCount: -1 };

  let query = Provider.find(filter).select(PRIVATE_FIELDS).populate('category', 'name').sort(sortBy);
  if (limit && Number(limit) > 0) query = query.limit(Number(limit));

  const providers = await query;
  res.json({ success: true, count: providers.length, providers });
});

const getProviderById = asyncHandler(async (req, res) => {
  const provider = await Provider.findOne({ _id: req.params.id, isApproved: true, isActive: true })
    .select(PRIVATE_FIELDS)
    .populate('category', 'name')
    .populate({ path: 'services', match: { isAvailable: true }, populate: { path: 'category', select: 'name' } });

  if (!provider) throw new AppError('Provider not found', 404);
  res.json({ success: true, provider });
});

const getProviderSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date || !isValidDateString(date)) throw new AppError('Please provide a valid date (YYYY-MM-DD)', 400);

  const provider = await Provider.findOne({ _id: req.params.id, isApproved: true, isActive: true });
  if (!provider) throw new AppError('Provider not found', 404);

  const dayName = getDayName(date);
  if (!provider.availability.days.includes(dayName)) {
    return res.json({ success: true, date, slots: [], message: `${provider.name} does not work on ${dayName}s` });
  }

  const allSlots = generateTimeSlots(provider.availability.startTime, provider.availability.endTime);
  const taken = await Booking.find({ provider: provider._id, date, status: { $in: ['pending', 'confirmed'] } }).select('time');
  const takenTimes = new Set(taken.map((booking) => booking.time));

  const slots = allSlots.map((time) => ({ time, available: !takenTimes.has(time) }));
  res.json({ success: true, date, slots });
});

const getAllProvidersAdmin = asyncHandler(async (req, res) => {
  const filter = {};
  if (['pending', 'approved', 'rejected'].includes(req.query.status)) filter.approvalStatus = req.query.status;

  const providers = await Provider.find(filter).populate('category', 'name').sort({ createdAt: -1 });
  res.json({ success: true, count: providers.length, providers });
});

const updateProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) throw new AppError('Provider not found', 404);

  if (req.body.name !== undefined) {
    if (!String(req.body.name).trim()) throw new AppError('Name cannot be empty', 400);
    provider.name = String(req.body.name).trim();
  }
  if (req.body.phone !== undefined) provider.phone = String(req.body.phone).trim();
  await applyProviderFields(provider, req.body);

  if (req.file) {
    const url = await uploadToCloudinary(req.file, 'providers');
    await deleteImage(provider.profileImage);
    provider.profileImage = url;
  }
  await provider.save();

  if (provider.user) {
    const changes = { name: provider.name, phone: provider.phone };
    if (req.file) changes.profileImage = provider.profileImage;
    await User.findByIdAndUpdate(provider.user, changes);
  }

  await provider.populate('category', 'name');
  res.json({ success: true, message: 'Provider updated', provider });
});

const approveProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id).populate('category', 'name');
  if (!provider) throw new AppError('Provider not found', 404);

  provider.isApproved = true;
  provider.approvalStatus = 'approved';
  await provider.save();
  res.json({ success: true, message: `${provider.name} is now approved`, provider });
});

const rejectProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id).populate('category', 'name');
  if (!provider) throw new AppError('Provider not found', 404);

  provider.isApproved = false;
  provider.approvalStatus = 'rejected';
  await provider.save();
  res.json({ success: true, message: `${provider.name} was rejected`, provider });
});

const toggleProviderActive = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id).populate('category', 'name');
  if (!provider) throw new AppError('Provider not found', 404);

  provider.isActive = !provider.isActive;
  await provider.save();
  res.json({ success: true, message: provider.isActive ? 'Provider activated' : 'Provider deactivated', provider });
});

const deleteProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) throw new AppError('Provider not found', 404);

  await deleteImage(provider.profileImage);
  await deleteProviderData(provider._id);

  if (provider.user) await User.findByIdAndUpdate(provider.user, { role: 'user' });

  res.json({ success: true, message: 'Provider deleted' });
});

module.exports = {
  getProviders,
  getProviderById,
  getProviderSlots,
  getAllProvidersAdmin,
  updateProvider,
  approveProvider,
  rejectProvider,
  toggleProviderActive,
  deleteProvider,
};
