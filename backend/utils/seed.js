// Fills the database with demo data so you can try the whole app straight away.
//
//   npm run seed                 load demo data (only if the database is empty)
//   npm run seed -- --force      wipe everything, then load demo data
//   npm run seed:destroy         wipe everything and stop
//
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { updateRatings } = require('./helpers');

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY_MS);
const toDateString = (date) => date.toISOString().slice(0, 10);

const nextWorkingDate = (offset) => {
  const date = new Date(Date.now() + offset * DAY_MS);
  if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
  return toDateString(date);
};

const categories = [
  { name: 'Beauty', description: 'Hair, makeup and skincare at home or in a studio.' },
  { name: 'Home Services', description: 'Help with assembly, painting and small jobs around the house.' },
  { name: 'Fitness', description: 'Personal trainers and coaches who come to you.' },
  { name: 'Cleaning', description: 'Regular and deep cleaning for homes and offices.' },
  { name: 'Repair', description: 'Fast fixes for appliances, plumbing and more.' },
  { name: 'Education', description: 'Tutors and teachers for school subjects and languages.' },
  { name: 'Wellness', description: 'Massage, meditation and other ways to recharge.' },
];

const customers = [
  { name: 'Alex Morgan', email: 'user@servicehub.com', phone: '555-0101' },
  { name: 'Jamie Lee', email: 'jamie@example.com', phone: '555-0102' },
  { name: 'Chris Walker', email: 'chris@example.com', phone: '555-0103' },
  { name: 'Taylor Kim', email: 'taylor@example.com', phone: '555-0104' },
];

const providerSeeds = [
  {
    name: 'Luna Reyes', email: 'luna@servicehub.com', phone: '555-0201', category: 'Beauty', location: 'Old Town', experience: 8, approved: true,
    bio: 'Hair stylist and makeup artist working from a small studio in Old Town. Known for natural, low-fuss looks that last all day.',
    services: [
      { title: 'Signature haircut and styling', description: 'Consultation, wash, cut and blow-dry. Bring a photo if you have a look in mind.', price: 45, duration: 60 },
      { title: 'Bridal and event makeup', description: 'A full look for weddings, parties and photoshoots, with a touch-up kit included.', price: 120, duration: 120 },
    ],
  },
  {
    name: 'Daniel Brooks', email: 'daniel@servicehub.com', phone: '555-0202', category: 'Home Services', location: 'Maple Heights', experience: 12, approved: true,
    bio: 'Handyman with a carpentry background. Arrives on time, brings his own tools and cleans up afterwards.',
    services: [
      { title: 'Furniture assembly and mounting', description: 'Flat-pack furniture, shelves, TV mounts and curtain rails put up properly and levelled.', price: 40, duration: 60 },
      { title: 'Interior painting, per room', description: 'Walls and ceiling for one standard room. Prep, masking and clean-up are included.', price: 150, duration: 240 },
    ],
  },
  {
    name: 'Maya Patel', email: 'maya@servicehub.com', phone: '555-0203', category: 'Fitness', location: 'Riverside', experience: 6, approved: true,
    bio: 'Certified personal trainer focused on strength and mobility for people who never enjoyed the gym.',
    services: [
      { title: 'One-on-one personal training', description: 'A session built around your goals, at home, in a park or at a local gym.', price: 55, duration: 60 },
      { title: 'Home yoga session', description: 'A slow, beginner-friendly flow with breathing work. Mats are provided.', price: 40, duration: 60 },
    ],
  },
  {
    name: 'Ana Costa', email: 'ana@servicehub.com', phone: '555-0204', category: 'Cleaning', location: 'Lakeview', experience: 5, approved: true,
    bio: 'Runs a small insured cleaning crew that has looked after Lakeview homes and offices for five years.',
    services: [
      { title: 'Deep home cleaning', description: 'Top-to-bottom clean including inside the oven and fridge and behind furniture. Supplies included.', price: 90, duration: 180 },
      { title: 'Kitchen and bathroom refresh', description: 'A focused scrub of the two rooms that need it most. Good for regular upkeep.', price: 60, duration: 90 },
    ],
  },
  {
    name: 'Omar Haddad', email: 'omar@servicehub.com', phone: '555-0205', category: 'Repair', location: 'Harbor District', experience: 15, approved: true,
    bio: 'Appliance and plumbing technician with fifteen years in the trade. Gives an honest quote before starting.',
    services: [
      { title: 'Appliance repair visit', description: 'Diagnosis and repair for washers, dryers, dishwashers and ovens. Parts are charged separately.', price: 50, duration: 60 },
      { title: 'Leak and tap repair', description: 'Dripping taps, running toilets and small leaks, fixed in the same visit where possible.', price: 45, duration: 60 },
    ],
  },
  {
    name: 'Sofia Martinez', email: 'sofia@servicehub.com', phone: '555-0206', category: 'Education', location: 'Greenfield', experience: 9, approved: true,
    bio: 'Former secondary school teacher who tutors maths and Spanish, online or at your kitchen table.',
    services: [
      { title: 'Maths tutoring, grades 6 to 12', description: 'Homework help and exam prep with clear worked examples. Every session is one-on-one.', price: 30, duration: 60 },
      { title: 'Spanish conversation practice', description: 'Relaxed speaking practice for beginner to intermediate learners.', price: 28, duration: 60 },
    ],
  },
  {
    name: 'Emma Wilson', email: 'emma@servicehub.com', phone: '555-0207', category: 'Wellness', location: 'Lakeview', experience: 10, approved: true,
    bio: 'Licensed massage therapist and meditation guide. Sessions are unhurried and tailored to how you feel that day.',
    services: [
      { title: 'Deep tissue massage', description: 'Firm pressure for tight shoulders, back and legs. Portable table and oils provided.', price: 70, duration: 60 },
      { title: 'Guided meditation and breathwork', description: 'One-on-one sessions for stress and sleep. No experience needed.', price: 25, duration: 45 },
    ],
  },
  {
    name: 'Noah Bennett', email: 'noah@servicehub.com', phone: '555-0208', category: 'Beauty', location: 'Old Town', experience: 3, approved: false,
    bio: 'Barber taking his first bookings on ServiceHub.',
    services: [],
  },
];

const reviewSeeds = [
  [0, 'Luna Reyes', 0, 5, 'Best haircut I have had in years. Luna listened and did exactly what I asked.', 12],
  [1, 'Luna Reyes', 1, 5, 'She did my makeup for a wedding and it lasted all night. Calm and very organised.', 40],
  [2, 'Luna Reyes', 0, 4, 'Great cut. Started a little late but worth the wait.', 75],
  [0, 'Daniel Brooks', 0, 5, 'Built a whole wardrobe and mounted the TV in under two hours.', 20],
  [3, 'Daniel Brooks', 1, 4, 'Neat painting and tidy afterwards. Would book again.', 95],
  [1, 'Maya Patel', 0, 5, 'Maya makes training feel doable. Three months in and I am stronger than ever.', 30],
  [2, 'Maya Patel', 1, 5, 'A perfect beginner yoga session at home.', 55],
  [3, 'Ana Costa', 0, 5, 'The flat has never been this clean. Very thorough team.', 18],
  [0, 'Ana Costa', 1, 4, 'The bathroom looks brand new. Would have liked more notice on arrival time.', 62],
  [1, 'Omar Haddad', 0, 5, 'Fixed our washing machine in one visit and explained what had failed.', 25],
  [2, 'Omar Haddad', 1, 5, 'Honest quote and a fast repair.', 110],
  [3, 'Sofia Martinez', 0, 5, "My daughter's maths grades went up within a month.", 35],
  [1, 'Sofia Martinez', 1, 4, 'Patient teacher and relaxed lessons.', 88],
  [2, 'Emma Wilson', 0, 5, 'Exactly the deep tissue massage I needed after a long month.', 15],
  [0, 'Emma Wilson', 1, 5, 'I have been sleeping better since the breathwork sessions.', 48],
  [3, 'Emma Wilson', 0, 4, 'Good pressure and very professional.', 130],
];

const upcomingSeeds = [
  { provider: 'Daniel Brooks', service: 0, offset: 2, time: '10:00', status: 'pending', notes: 'Two flat-pack wardrobes in the spare room.' },
  { provider: 'Maya Patel', service: 0, offset: 3, time: '17:00', status: 'confirmed', notes: '' },
  { provider: 'Ana Costa', service: 1, offset: 6, time: '09:00', status: 'cancelled', notes: 'Plans changed.' },
];

const wipe = async () => {
  await Promise.all([
    Review.deleteMany(),
    Booking.deleteMany(),
    Service.deleteMany(),
    Provider.deleteMany(),
    Category.deleteMany(),
    User.deleteMany(),
  ]);
};

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const args = process.argv.slice(2);

  if (args.includes('--destroy')) {
    await wipe();
    console.log('All data removed.');
    return;
  }

  if (!args.includes('--force') && (await User.countDocuments()) > 0) {
    console.log('The database already has data, so nothing was changed.');
    console.log('To wipe it and load the demo data, run: npm run seed -- --force');
    return;
  }

  console.log('Loading demo data...');
  await wipe();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@servicehub.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  await User.create({ name: 'ServiceHub Admin', email: adminEmail, password: adminPassword, role: 'admin', createdAt: daysAgo(150) });

  const categoryDocs = await Category.insertMany(categories);
  const categoryByName = {};
  categoryDocs.forEach((category) => {
    categoryByName[category.name] = category;
  });

  const customerDocs = [];
  for (const [index, customer] of customers.entries()) {
    customerDocs.push(await User.create({ ...customer, password: 'User@123', createdAt: daysAgo(130 - index * 30) }));
  }

  const providerByName = {};
  for (const [index, seedData] of providerSeeds.entries()) {
    const joined = daysAgo(140 - index * 12);
    const user = await User.create({
      name: seedData.name,
      email: seedData.email,
      phone: seedData.phone,
      password: 'Provider@123',
      role: 'provider',
      createdAt: joined,
    });

    const provider = await Provider.create({
      user: user._id,
      name: seedData.name,
      email: seedData.email,
      phone: seedData.phone,
      bio: seedData.bio,
      category: categoryByName[seedData.category]._id,
      location: seedData.location,
      experience: seedData.experience,
      isApproved: seedData.approved,
      approvalStatus: seedData.approved ? 'approved' : 'pending',
      createdAt: joined,
    });

    const services = [];
    for (const item of seedData.services) {
      services.push(await Service.create({ ...item, provider: provider._id, category: provider.category, createdAt: joined }));
    }
    provider.services = services.map((service) => service._id);
    await provider.save();

    providerByName[seedData.name] = { provider, services };
  }

  for (const [customerIndex, providerName, serviceIndex, stars, comment, days] of reviewSeeds) {
    const { provider, services } = providerByName[providerName];
    const service = services[serviceIndex];
    const customer = customerDocs[customerIndex];

    const booking = await Booking.create({
      user: customer._id,
      provider: provider._id,
      service: service._id,
      date: toDateString(daysAgo(days)),
      time: '10:00',
      address: `${10 + customerIndex} Elm Street`,
      status: 'completed',
      price: service.price,
      isReviewed: true,
      createdAt: daysAgo(days + 3),
    });

    await Review.create({
      user: customer._id,
      provider: provider._id,
      service: service._id,
      booking: booking._id,
      rating: stars,
      comment,
      createdAt: daysAgo(days - 1),
    });
  }

  for (const item of upcomingSeeds) {
    const { provider, services } = providerByName[item.provider];
    const service = services[item.service];
    await Booking.create({
      user: customerDocs[0]._id,
      provider: provider._id,
      service: service._id,
      date: nextWorkingDate(item.offset),
      time: item.time,
      address: '14 Maple Street, Maple Heights',
      notes: item.notes,
      status: item.status,
      price: service.price,
    });
  }

  for (const { provider, services } of Object.values(providerByName)) {
    for (const service of services) {
      await updateRatings({ provider: provider._id, service: service._id });
    }
  }

  console.log('\nDemo data loaded. You can log in with:\n');
  console.log(`  Admin panel : ${adminEmail} / ${adminPassword}`);
  console.log('  Customer    : user@servicehub.com / User@123');
  console.log('  Provider    : daniel@servicehub.com / Provider@123');
  console.log('  Pending     : noah@servicehub.com / Provider@123 (waiting for admin approval)\n');
};

seed()
  .catch((error) => {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
