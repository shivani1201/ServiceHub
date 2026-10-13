const User = require('../models/User');
const Provider = require('../models/Provider');
const Category = require('../models/Category');
const { AppError, asyncHandler, generateToken, sanitizeUser } = require('../utils/helpers');

const authenticate = async (email, password) => {
  if (!email || !password) throw new AppError('Please enter your email and password', 400);

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) throw new AppError('Your account has been deactivated. Please contact support.', 403);
  return user;
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, accountType, category, location, experience, bio } = req.body;

  if (!name || !email || !password) throw new AppError('Please enter your name, email and password', 400);
  if (String(password).length < 6) throw new AppError('Password must be at least 6 characters', 400);

  const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existing) throw new AppError('An account with this email already exists', 409);

  const role = accountType === 'provider' ? 'provider' : 'user';

  if (role === 'provider') {
    if (!category || !location) throw new AppError('Providers must choose a category and enter their location', 400);
    const categoryExists = await Category.exists({ _id: category, isActive: true });
    if (!categoryExists) throw new AppError('Please choose a valid category', 400);
  }

  const user = await User.create({ name, email, password, phone, role });

  let provider = null;
  if (role === 'provider') {
    try {
      provider = await Provider.create({
        user: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        category,
        location,
        experience: Number(experience) || 0,
        bio: bio || '',
      });
    } catch (error) {
      await user.deleteOne();
      throw error;
    }
  }

  res.status(201).json({
    success: true,
    message: role === 'provider' ? 'Account created. An admin will review your provider profile soon.' : 'Account created successfully',
    token: generateToken(user._id),
    user: sanitizeUser(user),
    provider,
  });
});

const login = asyncHandler(async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);
  if (user.role === 'admin') {
    throw new AppError('Admin accounts sign in through the admin panel', 403);
  }
  res.json({ success: true, message: 'Logged in successfully', token: generateToken(user._id), user: sanitizeUser(user) });
});

const adminLogin = asyncHandler(async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);
  if (user.role !== 'admin') {
    throw new AppError('This account does not have admin access', 403);
  }
  res.json({ success: true, message: 'Welcome back', token: generateToken(user._id), user: sanitizeUser(user) });
});

module.exports = { register, login, adminLogin };
