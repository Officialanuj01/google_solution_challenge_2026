const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Health check route
router.get('/', (req, res) => {
    res.json({ message: 'Authentication server is running' });
});

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/google', authController.googleAuth); // Google authentication endpoint

// Protected routes
router.get('/me', authMiddleware, authController.getMe);
router.put('/role', authMiddleware, authController.updateRole);

module.exports = router;
