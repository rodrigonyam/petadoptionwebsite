const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, sensitiveOperationLimit, logUserActivity } = require('../middleware/auth');
const { validationResult } = require('express-validator');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number'),
    body('phone')
        .optional()
        .matches(/^\+?[\d\s\-\(\)]+$/)
        .withMessage('Please enter a valid phone number'),
    body('userType')
        .optional()
        .isIn(['adopting', 'volunteering', 'both'])
        .withMessage('User type must be adopting, volunteering, or both')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please enter a valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            firstName,
            lastName,
            email,
            password,
            phone,
            address,
            userType,
            preferences
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email address'
            });
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            phone,
            address,
            userType: userType || 'adopting',
            preferences: {
                ...preferences,
                newsletter: preferences?.newsletter || false,
                emailNotifications: preferences?.emailNotifications !== false
            }
        });

        // Generate token
        const token = generateToken(user._id);

        // Remove password from output
        const userResponse = { ...user.toObject() };
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: userResponse
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', 
    loginValidation, 
    sensitiveOperationLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
    async (req, res, next) => {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            // Check for user (include password for authentication)
            const user = await User.findOne({ email }).select('+password');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check if account is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated. Please contact support.'
                });
            }

            // Check password
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate token
            const token = generateToken(user._id);

            // Remove password from output
            const userResponse = { ...user.toObject() };
            delete userResponse.password;

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: userResponse
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('favorites', 'name type breed images adoption.fee')
            .populate('adoptionHistory.pet', 'name type breed images');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/auth/me
// @desc    Update user profile
// @access  Private
router.put('/me', protect, logUserActivity('profile_update'), [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('phone')
        .optional()
        .matches(/^\+?[\d\s\-\(\)]+$/)
        .withMessage('Please enter a valid phone number')
], async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const allowedFields = [
            'firstName', 'lastName', 'phone', 'address', 'preferences', 
            'profile', 'userType'
        ];

        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).populate('favorites', 'name type breed images adoption.fee');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: user
        });

    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', 
    protect, 
    sensitiveOperationLimit(3, 60 * 60 * 1000), // 3 attempts per hour
    logUserActivity('password_change'),
    [
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('New password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number')
    ], async (req, res, next) => {
        try {
            // Check for validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { currentPassword, newPassword } = req.body;

            // Get user with password
            const user = await User.findById(req.user.id).select('+password');

            // Check current password
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/auth/logout
// @desc    Logout user (client should remove token)
// @access  Private
router.post('/logout', protect, logUserActivity('logout'), (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// @route   DELETE /api/auth/me
// @desc    Deactivate user account
// @access  Private
router.delete('/me', 
    protect, 
    sensitiveOperationLimit(1, 24 * 60 * 60 * 1000), // 1 attempt per day
    logUserActivity('account_deactivation'),
    async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);

            // Deactivate instead of delete to preserve data integrity
            user.isActive = false;
            await user.save();

            res.json({
                success: true,
                message: 'Account deactivated successfully'
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/auth/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', protect, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const stats = user.getStats();

        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;