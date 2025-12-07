const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const Pet = require('../models/Pet');
const Activity = require('../models/Activity');
const Shelter = require('../models/Shelter');
const Adoption = require('../models/Adoption');
const { protect, authorize, logUserActivity } = require('../middleware/auth');
const { validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only)
router.get('/', 
    protect, 
    authorize('admin'),
    async (req, res, next) => {
        try {
            const {
                page = 1,
                limit = 20,
                role,
                search,
                isActive
            } = req.query;

            // Build query
            let query = {};
            if (role) query.role = role;
            if (isActive !== undefined) query.isActive = isActive === 'true';
            
            if (search) {
                query.$or = [
                    { firstName: new RegExp(search, 'i') },
                    { lastName: new RegExp(search, 'i') },
                    { email: new RegExp(search, 'i') }
                ];
            }

            // Execute query with pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            const users = await User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await User.countDocuments(query);

            res.json({
                success: true,
                count: users.length,
                total: total,
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page),
                users: users
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/users/:id
// @desc    Get single user by ID
// @access  Private (Admin or user themselves)
router.get('/:id', protect, async (req, res, next) => {
    try {
        // Check if user is requesting their own profile or is admin
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this user profile'
            });
        }

        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('favorites', 'name type breed images adoption.fee');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user statistics if requested
        const stats = user.getStats();

        res.json({
            success: true,
            user: user,
            stats: stats
        });

    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/:id/role', 
    protect, 
    authorize('admin'),
    logUserActivity('user_role_updated'),
    [
        body('role')
            .isIn(['user', 'shelter_admin', 'admin'])
            .withMessage('Invalid role')
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

            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Prevent users from changing their own role
            if (req.user.id === req.params.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot change your own role'
                });
            }

            user.role = req.body.role;
            await user.save();

            res.json({
                success: true,
                message: `User role updated to ${req.body.role}`,
                user: {
                    id: user._id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   PUT /api/users/:id/status
// @desc    Activate/deactivate user account
// @access  Private (Admin only)
router.put('/:id/status', 
    protect, 
    authorize('admin'),
    logUserActivity('user_status_updated'),
    [
        body('isActive')
            .isBoolean()
            .withMessage('isActive must be true or false'),
        body('reason')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Reason must not exceed 500 characters')
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

            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Prevent users from deactivating their own account through this endpoint
            if (req.user.id === req.params.id && !req.body.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot deactivate your own account through this method'
                });
            }

            user.isActive = req.body.isActive;
            await user.save();

            res.json({
                success: true,
                message: `User account ${req.body.isActive ? 'activated' : 'deactivated'}`,
                user: {
                    id: user._id,
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    isActive: user.isActive
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/users/:id/favorites
// @desc    Get user's favorite pets
// @access  Private (User themselves or admin)
router.get('/:id/favorites', protect, async (req, res, next) => {
    try {
        // Check permissions
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this user\'s favorites'
            });
        }

        const user = await User.findById(req.params.id)
            .populate({
                path: 'favorites',
                populate: {
                    path: 'shelter',
                    select: 'name contact.phone contact.email'
                }
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            favorites: user.favorites,
            count: user.favorites.length
        });

    } catch (error) {
        next(error);
    }
});

// @route   GET /api/users/:id/adoptions
// @desc    Get user's adoption history
// @access  Private (User themselves or admin)
router.get('/:id/adoptions', protect, async (req, res, next) => {
    try {
        // Check permissions
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this user\'s adoptions'
            });
        }

        const adoptions = await Adoption.find({ adopter: req.params.id })
            .populate('pet', 'name type breed images adoption.fee')
            .populate('shelter', 'name contact.email contact.phone')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            adoptions: adoptions,
            count: adoptions.length
        });

    } catch (error) {
        next(error);
    }
});

// @route   GET /api/users/:id/activities
// @desc    Get user's registered activities
// @access  Private (User themselves or admin)
router.get('/:id/activities', protect, async (req, res, next) => {
    try {
        // Check permissions
        if (req.user.id !== req.params.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this user\'s activities'
            });
        }

        const activities = await Activity.find({
            'registrations.user': req.params.id
        }).populate('shelter', 'name contact.email contact.phone')
          .sort({ startDate: 1 });

        // Filter to show only user's registrations
        const userActivities = activities.map(activity => {
            const userRegistration = activity.registrations.find(
                reg => reg.user.toString() === req.params.id
            );
            
            return {
                ...activity.toObject(),
                userRegistration: userRegistration
            };
        });

        res.json({
            success: true,
            activities: userActivities,
            count: userActivities.length
        });

    } catch (error) {
        next(error);
    }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview
// @access  Private (Admin only)
router.get('/stats/overview', 
    protect, 
    authorize('admin'),
    async (req, res, next) => {
        try {
            const [
                totalUsers,
                activeUsers,
                newUsersThisMonth,
                usersByRole,
                usersByType
            ] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ isActive: true }),
                User.countDocuments({ 
                    createdAt: { 
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
                    }
                }),
                User.aggregate([
                    { $group: { _id: '$role', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
                User.aggregate([
                    { $group: { _id: '$userType', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ])
            ]);

            // Get user registration trends (last 12 months)
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

            const registrationTrends = await User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: twelveMonthsAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1 }
                }
            ]);

            const stats = {
                overview: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: totalUsers - activeUsers,
                    newThisMonth: newUsersThisMonth
                },
                byRole: usersByRole,
                byType: usersByType,
                registrationTrends: registrationTrends
            };

            res.json({
                success: true,
                stats: stats
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/users/:id/reset-password
// @desc    Reset user password (Admin only)
// @access  Private (Admin only)
router.post('/:id/reset-password', 
    protect, 
    authorize('admin'),
    logUserActivity('password_reset_by_admin'),
    [
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

            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Update password
            user.password = req.body.newPassword;
            await user.save();

            res.json({
                success: true,
                message: 'Password reset successfully'
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin only)
router.delete('/:id', 
    protect, 
    authorize('admin'),
    logUserActivity('user_deleted'),
    async (req, res, next) => {
        try {
            const user = await User.findById(req.params.id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Prevent deletion of own account
            if (req.user.id === req.params.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete your own account'
                });
            }

            // Check if user has active adoptions
            const activeAdoptions = await Adoption.countDocuments({
                adopter: req.params.id,
                status: { $in: ['pending', 'approved'] }
            });

            if (activeAdoptions > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete user with active adoption requests'
                });
            }

            // Soft delete - deactivate instead of removing
            user.isActive = false;
            user.email = `deleted_${Date.now()}_${user.email}`;
            await user.save();

            res.json({
                success: true,
                message: 'User account deactivated successfully'
            });

        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;