const express = require('express');
const {
  createBooking,
  getMyBookings,
  getProviderBookings,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const router = express.Router();

router.post('/', protect, authorizeRoles('user', 'provider'), createBooking);
router.get('/', protect, adminOnly, getAllBookings);
router.get('/my', protect, getMyBookings);
router.get('/provider', protect, authorizeRoles('provider'), getProviderBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id', protect, updateBooking);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
