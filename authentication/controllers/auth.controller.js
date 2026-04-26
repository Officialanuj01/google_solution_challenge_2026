const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Token generation functions
const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_ACCESS_SECRET || 'your-access-secret-key',
        { expiresIn: '15m' } // Access tokens expire in 15 minutes
    );
};

const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        { expiresIn: '7d' } // Refresh tokens expire in 7 days
    );
};

const verifyGoogleToken = async (access_token) => {
    try {
        console.log('Verifying Google token:', access_token ? 'Token present' : 'No token');
        const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        
        console.log('Google API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('Google API error response:', errorText);
            throw new Error('Invalid token');
        }
        
        const tokenInfo = await response.json();
        console.log('Token verification successful');
        return true;
    } catch (error) {
        console.error('Google token verification error:', error);
        throw new Error('Invalid Google token');
    }
};

const authController = {
    // Google authentication
    googleAuth: async (req, res) => {
        try {
            console.log('Google auth request received');
            const { access_token, email, name, sub } = req.body;
            console.log('Request data:', { 
                hasToken: !!access_token, 
                email, 
                name, 
                sub 
            });
            
            // Verify the access token is valid
            await verifyGoogleToken(access_token);
            console.log('Token verification passed');
            
            // Find or create user
            let user = await User.findOne({ email });
            console.log('User lookup result:', user ? 'User found' : 'New user');
            
            if (!user) {
                // Create new user if doesn't exist
                console.log('Creating new user');
                const newUserData = {
                    username: name,
                    email: email,
                    isGoogleUser: true,
                    googleId: sub, // Google's unique identifier
                    password: undefined, // No password for Google users
                };
                
                // Set demo role for teamdsa@gmail.com, otherwise don't set role (will default to null)
                if (email === 'teamdsa@gmail.com') {
                    newUserData.role = 'demo';
                }
                
                user = new User(newUserData);
            } else if (!user.isGoogleUser) {
                // If user exists but is not a Google user, don't allow Google login
                console.log('User exists but not a Google user');
                return res.status(400).json({
                    message: 'Email already registered with password authentication'
                });
            }

            // Generate tokens
            console.log('Generating tokens');
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);
            
            // Save refresh token and update Google ID if needed
            user.refreshToken = refreshToken;
            if (!user.googleId) {
                user.googleId = sub;
            }
            await user.save();
            console.log('User saved successfully');

            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            console.log('Sending success response');
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
            console.error('Google auth error:', error);
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

            // Check if user already exists
            const existingUser = await User.findOne({ 
                $or: [{ email }, { username }] 
            });
            
            if (existingUser) {
                return res.status(400).json({ 
                    message: 'User already exists' 
                });
            }

            // Create new user
            const newUserData = {
                username,
                email,
                password,
            };
            
            // Set demo role for teamdsa@gmail.com, otherwise don't set role (will default to null)
            if (email === 'teamdsa@gmail.com') {
                newUserData.role = 'demo';
            }
            
            const user = new User(newUserData);

            // Generate tokens
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);
            
            // Save refresh token to user document
            user.refreshToken = refreshToken;
            await user.save();

            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ 
                    message: 'Invalid credentials' 
                });
            }

            if (user.isGoogleUser) {
                return res.status(400).json({
                    message: 'This account uses Google sign-in. Please continue with Google.'
                });
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).json({ 
                    message: 'Invalid credentials' 
                });
            }

            // Generate new tokens
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);
            
            // Save refresh token to user document
            user.refreshToken = refreshToken;
            await user.save();

            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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
            res.status(500).json({ 
                message: 'Error logging in',
                error: error.message 
            });
        }
    },

    // Get current user
    getMe: async (req, res) => {
        try {
            const user = await User.findById(req.user.userId).select('-password -refreshToken');
            if (!user) {
                return res.status(404).json({ 
                    message: 'User not found' 
                });
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
            
            // Validate role
            if (!['shopkeeper', 'delivery_person'].includes(role)) {
                return res.status(400).json({ 
                    message: 'Invalid role. Must be shopkeeper or delivery_person' 
                });
            }

            // Update user role
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ 
                    message: 'User not found' 
                });
            }

            // Don't allow changing demo role
            if (user.role === 'demo') {
                return res.status(403).json({ 
                    message: 'Demo role cannot be changed' 
                });
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

    // Refresh token endpoint
    refresh: async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            
            if (!refreshToken) {
                return res.status(401).json({ message: 'Refresh token required' });
            }

            // Verify refresh token
            const decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
            );

            // Find user and check if refresh token matches
            const user = await User.findById(decoded.userId);
            if (!user || user.refreshToken !== refreshToken) {
                return res.status(401).json({ message: 'Invalid refresh token' });
            }

            // Generate new access token
            const accessToken = generateAccessToken(user._id);

            res.json({
                accessToken
            });

        } catch (error) {
            res.status(401).json({ 
                message: 'Invalid refresh token',
                error: error.message 
            });
        }
    },

    // Logout endpoint
    logout: async (req, res) => {
        try {
            // Clear refresh token in database
            const refreshToken = req.cookies.refreshToken;
            if (refreshToken) {
                await User.findOneAndUpdate(
                    { refreshToken },
                    { $set: { refreshToken: null } }
                );
            }

            // Clear refresh token cookie
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
