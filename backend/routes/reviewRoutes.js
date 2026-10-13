const express = require('express');
const {
  getAllReviews,
  getProviderReviews,
  getServiceReviews,
  createReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/', protect, adminOnly, getAllReviews);
router.get('/provider/:providerId', getProviderReviews);
router.get('/service/:serviceId', getServiceReviews);
router.post('/', protect, authorizeRoles('user', 'provider'), createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
