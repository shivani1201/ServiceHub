const Category = require('../models/Category');
const Service = require('../models/Service');
const Provider = require('../models/Provider');
const { AppError, asyncHandler, escapeRegex, uploadToCloudinary, deleteImage } = require('../utils/helpers');

const withServiceCounts = async (categories, publicOnly) => {
  const match = {};
  if (publicOnly) {
    match.isAvailable = true;
    match.provider = { $in: await Provider.find({ isApproved: true, isActive: true }).distinct('_id') };
  }
  const counts = await Service.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }]);

  const countById = {};
  counts.forEach((item) => {
    countById[String(item._id)] = item.count;
  });
  return categories.map((category) => ({ ...category.toObject(), serviceCount: countById[String(category._id)] || 0 }));
};

const assertNameIsFree = async (name, ignoreId) => {
  const filter = { name: new RegExp(`^${escapeRegex(name)}$`, 'i') };
  if (ignoreId) filter._id = { $ne: ignoreId };
  if (await Category.exists(filter)) throw new AppError('A category with this name already exists', 409);
};

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, count: categories.length, categories: await withServiceCounts(categories, true) });
});

const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, count: categories.length, categories: await withServiceCounts(categories, false) });
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  res.json({ success: true, category });
});

const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) throw new AppError('Category name is required', 400);
  await assertNameIsFree(name);

  const image = req.file ? await uploadToCloudinary(req.file, 'categories') : '';
  const category = await Category.create({
    name,
    description: req.body.description || '',
    isActive: req.body.isActive === undefined ? true : req.body.isActive,
    image,
  });
  res.status(201).json({ success: true, message: 'Category created', category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) throw new AppError('Category name cannot be empty', 400);
    await assertNameIsFree(name, category._id);
    category.name = name;
  }
  if (req.body.description !== undefined) category.description = req.body.description;
  if (req.body.isActive !== undefined) category.isActive = req.body.isActive;

  if (req.file) {
    const url = await uploadToCloudinary(req.file, 'categories');
    await deleteImage(category.image);
    category.image = url;
  }
  await category.save();
  res.json({ success: true, message: 'Category updated', category });
});

const toggleCategoryActive = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  category.isActive = !category.isActive;
  await category.save();
  res.json({ success: true, message: category.isActive ? 'Category enabled' : 'Category disabled', category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const [services, providers] = await Promise.all([
    Service.countDocuments({ category: category._id }),
    Provider.countDocuments({ category: category._id }),
  ]);
  if (services + providers > 0) {
    throw new AppError('This category is still used by services or providers. Disable it instead of deleting it.', 400);
  }

  await deleteImage(category.image);
  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});

module.exports = {
  getCategories,
  getAllCategoriesAdmin,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  deleteCategory,
};
