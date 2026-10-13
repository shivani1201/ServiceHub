const express = require('express');
const {
  getCategories,
  getAllCategoriesAdmin,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryActive,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getCategories);
router.get('/admin/all', protect, adminOnly, getAllCategoriesAdmin);
router.get('/:id', getCategoryById);
router.post('/', protect, adminOnly, upload.single('image'), createCategory);
router.put('/:id', protect, adminOnly, upload.single('image'), updateCategory);
router.put('/:id/toggle-active', protect, adminOnly, toggleCategoryActive);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
