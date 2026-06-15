/**
 * @fileoverview Global error handling middleware for EmoCare.
 * Catches and normalizes errors from all routes, providing
 * consistent JSON error responses with appropriate HTTP status codes.
 * @module middleware/errorHandler
 */

/**
 * Global error handler middleware.
 *
 * Handles specific error types with tailored responses:
 * - Mongoose ValidationError → 400 Bad Request
 * - Mongoose CastError → 400 Bad Request (invalid ObjectId, etc.)
 * - MongoDB duplicate key error (code 11000) → 409 Conflict
 * - JWT errors → 401 Unauthorized
 * - Default → 500 Internal Server Error (with sanitized message in production)
 *
 * @param {Error} err - The error object thrown or passed via next(err)
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {void}
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the full error in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Error:', err);
  } else {
    console.error('🔥 Error:', err.message);
  }

  // ------- Mongoose Validation Error -------
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  // ------- Mongoose Cast Error (bad ObjectId, etc.) -------
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // ------- MongoDB Duplicate Key Error -------
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : 'unknown';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}: "${value}". This ${field} is already in use.`,
    });
  }

  // ------- JWT Errors -------
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please authenticate again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired. Please log in again.',
    });
  }

  // ------- Custom Application Errors (with statusCode) -------
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // ------- Default: Internal Server Error -------
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  return res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
