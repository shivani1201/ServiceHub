const { AppError } = require('../utils/helpers');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = field === 'email' ? 'An account with this email already exists' : `That ${field} is already in use`;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID or value in the request';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'That image is too large. The maximum size is 5MB.' : err.message;
  }

  if (statusCode >= 500) console.error(err);
  if (statusCode >= 500 && !err.isOperational && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong on the server';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
