/**
 * Pulse — Auth Controller
 * Migrated from: authentication/controllers/auth.controller.js
 * Handles user registration, login, Google OAuth, and role management
 */
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const DEMO_USER = {
    id: 'demo-user',
    username: 'Demo User',
    email: 'teamdsa@gmail.com',
    role: 'demo'
};

const isDemoFallbackEnabled = () => process.env.ALLOW_DEMO_WITHOUT_DB !== 'false';

const isMongoUnavailable = (error) => {
    if (!error) return false;
    const message = error.message || '';
    return (
        error.name === 'MongooseServerSelectionError' ||
        error.code === 'ECONNREFUSED' ||
        message.includes('ECONNREFUSED') ||
        message.includes('Mongo')
    );
};

// Token generation functions
const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        { expiresIn: '7d' }
    );
};

const verifyGoogleToken = async (access_token) => {
    try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${access_token}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Invalid token');
        }

        return true;
    } catch (error) {
        logger.error('Google token verification error:', error);
        throw new Error('Invalid Google token');
    }
};

const authController = {
    // Google authentication
    googleAuth: async (req, res) => {
        try {
            const { access_token, email, name, sub } = req.body;

            // Verify the access token is valid
            await verifyGoogleToken(access_token);

            // Find or create user
            let user = await User.findOne({ email });

            if (!user) {
                const newUserData = {
                    username: name,
                    email: email,
                    isGoogleUser: true,
                    googleId: sub,
                    password: undefined,
                };

                // Set demo role for teamdsa@gmail.com
                if (email === 'teamdsa@gmail.com') {
                    newUserData.role = 'demo';
                }

                user = new User(newUserData);
            } else if (!user.isGoogleUser) {
                return res.status(400).json({
                    message: 'Email already registered with password authentication'
                });
            }

            // Generate tokens
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            if (!user.googleId) user.googleId = sub;
            await user.save();

            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                message: 'Google authentication successful',
                accessToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    isGoogleUser: user.isGoogleUser,
                    role: user.role
                }
            });
        } catch (error) {
            logger.error('Google auth error:', error);
            res.status(500).json({
                message: 'Error with Google authentication',
                error: error.message
            });
        }
    },

    // Register new user
    register: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const newUserData = { username, email, password };
            if (email === 'teamdsa@gmail.com') {
                newUserData.role = 'demo';
            }

            const user = new User(newUserData);

            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            await user.save();

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.status(201).json({
                message: 'User registered successfully',
                accessToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error registering user',
                error: error.message
            });
        }
    },

    // Login user
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (
                isDemoFallbackEnabled() &&
                email === DEMO_USER.email &&
                password === 'teamdsa'
            ) {
                const accessToken = generateAccessToken(DEMO_USER.id);
                const refreshToken = generateRefreshToken(DEMO_USER.id);

                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000
                });

                return res.json({
                    message: 'Login successful (demo mode)',
                    accessToken,
                    user: DEMO_USER
                });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            if (user.isGoogleUser) {
                return res.status(400).json({
                    message: 'This account uses Google sign-in. Please continue with Google.'
                });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            await user.save();

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                message: 'Login successful',
                accessToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            if (isMongoUnavailable(error)) {
                return res.status(503).json({
                    message: 'Database unavailable. Use demo credentials for temporary access.',
                    error: error.message
                });
            }

            res.status(500).json({
                message: 'Error logging in',
                error: error.message
            });
        }
    },

    // Get current user
    getMe: async (req, res) => {
        try {
            if (req.user.userId === DEMO_USER.id) {
                return res.json(DEMO_USER);
            }

            const user = await User.findById(req.user.userId).select('-password -refreshToken');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({
                message: 'Error fetching user',
                error: error.message
            });
        }
    },

    // Update user role
    updateRole: async (req, res) => {
        try {
            const { role } = req.body;

            if (!['shopkeeper', 'delivery_person'].includes(role)) {
                return res.status(400).json({
                    message: 'Invalid role. Must be shopkeeper or delivery_person'
                });
            }

            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (user.role === 'demo') {
                return res.status(403).json({ message: 'Demo role cannot be changed' });
            }

            user.role = role;
            await user.save();

            res.json({
                message: 'Role updated successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error updating role',
                error: error.message
            });
        }
    },

    // Refresh token
    refresh: async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({ message: 'Refresh token required' });
            }

            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
            );

            if (decoded.userId === DEMO_USER.id) {
                const accessToken = generateAccessToken(DEMO_USER.id);
                return res.json({ accessToken });
            }

            const user = await User.findById(decoded.userId);
            if (!user || user.refreshToken !== refreshToken) {
                return res.status(401).json({ message: 'Invalid refresh token' });
            }

            const accessToken = generateAccessToken(user._id);
            res.json({ accessToken });
        } catch (error) {
            res.status(401).json({
                message: 'Invalid refresh token',
                error: error.message
            });
        }
    },

    // Logout
    logout: async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (refreshToken) {
                await User.findOneAndUpdate(
                    { refreshToken },
                    { $set: { refreshToken: null } }
                );
            }

            res.clearCookie('refreshToken');
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            res.status(500).json({
                message: 'Error logging out',
                error: error.message
            });
        }
    }
};

module.exports = authController;
