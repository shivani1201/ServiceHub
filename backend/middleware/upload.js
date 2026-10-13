const multer = require('multer');
const { AppError } = require('../utils/helpers');

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) return cb(null, true);
    cb(new AppError('Only JPG, PNG or WEBP images are allowed', 400));
  },
});

module.exports = upload;
