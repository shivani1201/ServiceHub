const Service = require('../models/Service');
const Provider = require('../models/Provider');
const Category = require('../models/Category');
const Booking = require('../models/Booking');
const { AppError, asyncHandler, escapeRegex, uploadToCloudinary, deleteImage } = require('../utils/helpers');

const CARD_PROVIDER_FIELDS = 'name profileImage rating reviewCount location';

const getOwnProvider = async (user) => {
  const provider = await Provider.findOne({ user: user._id });
  if (!provider) throw new AppError('Provider profile not found', 403);
  return provider;
};

const assertCanManage = async (user, service) => {
  if (user.role === 'admin') return;
  const provider = await getOwnProvider(user);
  if (!service.provider.equals(provider._id)) throw new AppError('You can only manage your own services', 403);
};

const parsePositiveNumber = (value, label) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new AppError(`${label} must be a positive number`, 400);
  return number;
};

const getServices = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, sort, provider } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);

  const providerFilter = { isApproved: true, isActive: true };
  if (provider) providerFilter._id = provider;
  const visibleProviders = await Provider.find(providerFilter).distinct('_id');
  const activeCategories = await Category.find({ isActive: true }).distinct('_id');

  const filter = { isAvailable: true, provider: { $in: visibleProviders }, category: { $in: activeCategories } };

  if (category) filter.category = { $in: activeCategories.filter((id) => String(id) === category) };

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    const matchedCategories = await Category.find({ name: regex }).distinct('_id');
    const matchedProviders = await Provider.find({ name: regex }).distinct('_id');
    filter.$or = [
      { title: regex },
      { description: regex },
      { category: { $in: matchedCategories } },
      { provider: { $in: matchedProviders } },
    ];
  }

  const priceFilter = {};
  if (minPrice !== undefined && minPrice !== '' && !Number.isNaN(Number(minPrice))) priceFilter.$gte = Number(minPrice);
  if (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(Number(maxPrice))) priceFilter.$lte = Number(maxPrice);
  if (Object.keys(priceFilter).length > 0) filter.price = priceFilter;

  const sortOptions = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1, numReviews: -1 },
    newest: { createdAt: -1 },
  };
  const sortBy = sortOptions[sort] || sortOptions.newest;

  const total = await Service.countDocuments(filter);
  const services = await Service.find(filter)
    .populate('provider', CARD_PROVIDER_FIELDS)
    .populate('category', 'name')
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({ success: true, count: services.length, total, page, pages: Math.max(Math.ceil(total / limit), 1), services });
});

const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
    .populate('provider', `${CARD_PROVIDER_FIELDS} experience bio availability isApproved isActive`)
    .populate('category', 'name description');

  const provider = service && service.provider;
  if (!service || !service.isAvailable || !provider || !provider.isApproved || !provider.isActive) {
    throw new AppError('Service not found', 404);
  }
  res.json({ success: true, service });
});

const getMyServices = asyncHandler(async (req, res) => {
  const provider = await getOwnProvider(req.user);
  const services = await Service.find({ provider: provider._id }).populate('category', 'name').sort({ createdAt: -1 });
  res.json({ success: true, count: services.length, services });
});

const getAllServicesAdmin = asyncHandler(async (req, res) => {
  const services = await Service.find()
    .populate('provider', 'name profileImage isApproved')
    .populate('category', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: services.length, services });
});

const createService = asyncHandler(async (req, res) => {
  const { title, description, price, duration, category, isAvailable, provider: providerId } = req.body;
  if (!title || !description || price === undefined || price === '' || !duration || !category) {
    throw new AppError('Please fill in the title, description, price, duration and category', 400);
  }
  const priceNumber = parsePositiveNumber(price, 'Price');
  const durationNumber = parsePositiveNumber(duration, 'Duration');

  let provider;
  if (req.user.role === 'admin') {
    provider = providerId ? await Provider.findById(providerId) : null;
    if (!provider) throw new AppError('Please choose a provider for this service', 400);
  } else {
    provider = await getOwnProvider(req.user);
    if (!provider.isApproved) {
      throw new AppError('Your provider profile is waiting for admin approval. You can add services once it is approved.', 403);
    }
  }

  if (!(await Category.exists({ _id: category }))) throw new AppError('Category not found', 400);

  const image = req.file ? await uploadToCloudinary(req.file, 'services') : '';
  const service = await Service.create({
    provider: provider._id,
    category,
    title,
    description,
    price: priceNumber,
    duration: durationNumber,
    image,
    isAvailable: isAvailable === undefined ? true : isAvailable,
  });

  provider.services.push(service._id);
  await provider.save();

  await service.populate([
    { path: 'category', select: 'name' },
    { path: 'provider', select: 'name' },
  ]);
  res.status(201).json({ success: true, message: 'Service created', service });
});

const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new AppError('Service not found', 404);
  await assertCanManage(req.user, service);

  const { title, description, price, duration, category, isAvailable } = req.body;
  if (title !== undefined) service.title = title;
  if (description !== undefined) service.description = description;
  if (price !== undefined && price !== '') service.price = parsePositiveNumber(price, 'Price');
  if (duration !== undefined && duration !== '') service.duration = parsePositiveNumber(duration, 'Duration');
  if (isAvailable !== undefined) service.isAvailable = isAvailable;

  if (category && String(category) !== String(service.category)) {
    if (!(await Category.exists({ _id: category }))) throw new AppError('Category not found', 400);
    service.category = category;
  }

  if (req.file) {
    const url = await uploadToCloudinary(req.file, 'services');
    await deleteImage(service.image);
    service.image = url;
  }
  await service.save();

  await service.populate([
    { path: 'category', select: 'name' },
    { path: 'provider', select: 'name' },
  ]);
  res.json({ success: true, message: 'Service updated', service });
});

const toggleService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new AppError('Service not found', 404);
  await assertCanManage(req.user, service);

  service.isAvailable = !service.isAvailable;
  await service.save();
  res.json({ success: true, message: service.isAvailable ? 'Service enabled' : 'Service disabled', service });
});

const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new AppError('Service not found', 404);
  await assertCanManage(req.user, service);

  const activeBookings = await Booking.countDocuments({ service: service._id, status: { $in: ['pending', 'confirmed'] } });
  if (activeBookings > 0) {
    throw new AppError('This service has pending or confirmed bookings. Disable it instead of deleting it.', 400);
  }

  await deleteImage(service.image);
  await Provider.updateOne({ _id: service.provider }, { $pull: { services: service._id } });
  await service.deleteOne();
  res.json({ success: true, message: 'Service deleted' });
});

module.exports = {
  getServices,
  getServiceById,
  getMyServices,
  getAllServicesAdmin,
  createService,
  updateService,
  toggleService,
  deleteService,
};
