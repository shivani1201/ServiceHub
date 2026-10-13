const express = require('express');
const {
  getProviders,
  getProviderById,
  getProviderSlots,
  getAllProvidersAdmin,
  updateProvider,
  approveProvider,
  rejectProvider,
  toggleProviderActive,
  deleteProvider,
} = require('../controllers/providerController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getProviders);
router.get('/admin/all', protect, adminOnly, getAllProvidersAdmin);
router.get('/:id/slots', getProviderSlots);
router.get('/:id', getProviderById);
router.put('/:id', protect, adminOnly, upload.single('image'), updateProvider);
router.put('/:id/approve', protect, adminOnly, approveProvider);
router.put('/:id/reject', protect, adminOnly, rejectProvider);
router.put('/:id/toggle-active', protect, adminOnly, toggleProviderActive);
router.delete('/:id', protect, adminOnly, deleteProvider);

module.exports = router;
