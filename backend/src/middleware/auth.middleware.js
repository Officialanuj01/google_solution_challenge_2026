/**
 * Predelix — Authentication Middleware
 * JWT verification for protected routes
 * Migrated from: authentication/middleware/auth.middleware.js
 */
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const authMiddleware = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_ACCESS_SECRET || 'your-access-secret-key'
        );

        // Attach user info to request
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        logger.warn('Auth middleware: Invalid token', { error: error.message });
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;
