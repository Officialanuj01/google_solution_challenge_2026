/**
 * Pulse — Error Handling Middleware
 * Centralized error handling for the backend API
 */
const { logger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
    // Log the error
    logger.error('Unhandled error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    // Send error response
    res.status(statusCode).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

module.exports = { errorHandler };
