/**
 * Predelix — Auth Routes
 * Migrated from: authentication/routes/auth.routes.js
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Health check
router.get('/', (req, res) => {
    res.json({ message: 'Authentication service is running' });
});

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/google', authController.googleAuth);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);
router.put('/role', authMiddleware, authController.updateRole);

module.exports = router;
