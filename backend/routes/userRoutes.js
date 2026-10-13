const express = require('express');
const {
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  getUserById,
  toggleUserActive,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('image'), updateProfile);
router.put('/password', protect, changePassword);

router.get('/', protect, adminOnly, getUsers);
router.get('/:id', protect, adminOnly, getUserById);
router.put('/:id/toggle-active', protect, adminOnly, toggleUserActive);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
