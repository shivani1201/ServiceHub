const express = require('express');
const {
  getServices,
  getServiceById,
  getMyServices,
  getAllServicesAdmin,
  createService,
  updateService,
  toggleService,
  deleteService,
} = require('../controllers/serviceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getServices);
router.get('/admin/all', protect, adminOnly, getAllServicesAdmin);
router.get('/my', protect, authorizeRoles('provider'), getMyServices);
router.get('/:id', getServiceById);
router.post('/', protect, authorizeRoles('provider', 'admin'), upload.single('image'), createService);
router.put('/:id', protect, authorizeRoles('provider', 'admin'), upload.single('image'), updateService);
router.put('/:id/toggle', protect, authorizeRoles('provider', 'admin'), toggleService);
router.delete('/:id', protect, authorizeRoles('provider', 'admin'), deleteService);

module.exports = router;
