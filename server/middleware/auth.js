/**
 * @fileoverview JWT authentication middleware for EmoCare.
 * Extracts and verifies Bearer tokens from the Authorization header,
 * attaching the decoded user payload to the request object.
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');

/**
 * Authentication middleware that validates JWT tokens.
 *
 * Expects the Authorization header in the format: "Bearer <token>"
 * On success, attaches `req.user` with `{ id, email }` from the token payload.
 * On failure, returns a 401 Unauthorized response.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {void}
 */
const auth = (req, res, next) => {
  try {
    // Extract the Authorization header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authorization header provided.',
      });
    }

    // Validate Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid authorization format. Use: Bearer <token>',
      });
    }

    // Extract the token after "Bearer "
    const token = authHeader.slice(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

module.exports = auth;
