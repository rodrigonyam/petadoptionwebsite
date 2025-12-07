const express = require('express');
const { body, query } = require('express-validator');
const Activity = require('../models/Activity');
const { protect, authorize, logUserActivity } = require('../middleware/auth');
const { validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/activities
// @desc    Get all activities with filters and pagination
// @access  Public
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['adoption_event', 'fundraiser', 'training', 'volunteer', 'educational', 'social']).withMessage('Invalid activity type'),
    query('shelter').optional().isMongoId().withMessage('Invalid shelter ID'),
    query('upcoming').optional().isBoolean().withMessage('Upcoming must be true or false'),
    query('search').optional().isString().withMessage('Search term must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
], async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: errors.array()
            });
        }

        const {
            page = 1,
            limit = 12,
            type,
            shelter,
            upcoming,
            search,
            startDate,
            endDate
        } = req.query;

        // Build query
        let query = {};

        if (type) query.type = type;
        if (shelter) query.shelter = shelter;

        // Date filters
        if (upcoming === 'true') {
            query.startDate = { $gte: new Date() };
        }

        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        // Search filter
        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { location: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const activities = await Activity.find(query)
            .populate('shelter', 'name contact.email contact.phone address')
            .sort({ startDate: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Activity.countDocuments(query);

        res.json({
            success: true,
            count: activities.length,
            total: total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            activities: activities
        });

    } catch (error) {
        next(error);
    }
});

// @route   GET /api/activities/:id
// @desc    Get single activity by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        const activity = await Activity.findById(req.params.id)
            .populate('shelter', 'name contact address website description')
            .populate('registrations.user', 'firstName lastName email');

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        res.json({
            success: true,
            activity: activity
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/activities
// @desc    Create a new activity
// @access  Private (Shelter Admin only)
router.post('/', 
    protect, 
    authorize('shelter_admin', 'admin'),
    logUserActivity('activity_created'),
    [
        body('title')
            .trim()
            .isLength({ min: 5, max: 100 })
            .withMessage('Title must be between 5 and 100 characters'),
        body('description')
            .trim()
            .isLength({ min: 20, max: 1000 })
            .withMessage('Description must be between 20 and 1000 characters'),
        body('type')
            .isIn(['adoption_event', 'fundraiser', 'training', 'volunteer', 'educational', 'social'])
            .withMessage('Invalid activity type'),
        body('startDate')
            .isISO8601()
            .withMessage('Start date must be a valid date'),
        body('endDate')
            .isISO8601()
            .withMessage('End date must be a valid date'),
        body('location')
            .trim()
            .isLength({ min: 5, max: 200 })
            .withMessage('Location must be between 5 and 200 characters'),
        body('capacity')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Capacity must be a positive integer'),
        body('fee')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Fee must be a positive number'),
        body('shelter')
            .isMongoId()
            .withMessage('Invalid shelter ID')
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

            // Validate dates
            if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }

            // Create activity
            const activity = await Activity.create({
                ...req.body,
                organizer: req.user.id
            });

            // Populate shelter information
            await activity.populate('shelter', 'name contact.email contact.phone address');

            res.status(201).json({
                success: true,
                message: 'Activity created successfully',
                activity: activity
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   PUT /api/activities/:id
// @desc    Update activity information
// @access  Private (Shelter Admin only)
router.put('/:id', 
    protect, 
    authorize('shelter_admin', 'admin'),
    logUserActivity('activity_updated'),
    [
        body('title')
            .optional()
            .trim()
            .isLength({ min: 5, max: 100 })
            .withMessage('Title must be between 5 and 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ min: 20, max: 1000 })
            .withMessage('Description must be between 20 and 1000 characters'),
        body('type')
            .optional()
            .isIn(['adoption_event', 'fundraiser', 'training', 'volunteer', 'educational', 'social'])
            .withMessage('Invalid activity type'),
        body('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date must be a valid date'),
        body('endDate')
            .optional()
            .isISO8601()
            .withMessage('End date must be a valid date'),
        body('location')
            .optional()
            .trim()
            .isLength({ min: 5, max: 200 })
            .withMessage('Location must be between 5 and 200 characters'),
        body('capacity')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Capacity must be a positive integer'),
        body('fee')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Fee must be a positive number')
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

            const activity = await Activity.findById(req.params.id);

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            // Validate dates if both are provided
            const startDate = req.body.startDate || activity.startDate;
            const endDate = req.body.endDate || activity.endDate;
            
            if (new Date(startDate) >= new Date(endDate)) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }

            // Update activity
            const updatedActivity = await Activity.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            ).populate('shelter', 'name contact.email contact.phone address');

            res.json({
                success: true,
                message: 'Activity updated successfully',
                activity: updatedActivity
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/activities/:id/register
// @desc    Register for an activity
// @access  Private
router.post('/:id/register', 
    protect, 
    logUserActivity('activity_registered'),
    [
        body('notes')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Notes must not exceed 500 characters'),
        body('emergencyContact')
            .optional()
            .trim()
            .isLength({ min: 5, max: 100 })
            .withMessage('Emergency contact must be between 5 and 100 characters')
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

            const activity = await Activity.findById(req.params.id);

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            // Check if activity is in the past
            if (new Date(activity.startDate) < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot register for past activities'
                });
            }

            // Check if user is already registered
            const existingRegistration = activity.registrations.find(
                reg => reg.user.toString() === req.user.id
            );

            if (existingRegistration) {
                return res.status(400).json({
                    success: false,
                    message: 'You are already registered for this activity'
                });
            }

            // Check capacity
            if (activity.capacity && activity.registrations.length >= activity.capacity) {
                return res.status(400).json({
                    success: false,
                    message: 'This activity is at full capacity'
                });
            }

            // Add registration
            activity.registrations.push({
                user: req.user.id,
                registeredAt: new Date(),
                notes: req.body.notes || '',
                emergencyContact: req.body.emergencyContact || ''
            });

            await activity.save();

            // Populate the new registration
            await activity.populate('registrations.user', 'firstName lastName email');

            res.json({
                success: true,
                message: 'Successfully registered for activity',
                activity: activity
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   DELETE /api/activities/:id/register
// @desc    Unregister from an activity
// @access  Private
router.delete('/:id/register', 
    protect, 
    logUserActivity('activity_unregistered'),
    async (req, res, next) => {
        try {
            const activity = await Activity.findById(req.params.id);

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            // Check if activity is in the past
            if (new Date(activity.startDate) < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot unregister from past activities'
                });
            }

            // Find and remove registration
            const registrationIndex = activity.registrations.findIndex(
                reg => reg.user.toString() === req.user.id
            );

            if (registrationIndex === -1) {
                return res.status(400).json({
                    success: false,
                    message: 'You are not registered for this activity'
                });
            }

            activity.registrations.splice(registrationIndex, 1);
            await activity.save();

            res.json({
                success: true,
                message: 'Successfully unregistered from activity'
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   PUT /api/activities/:id/registration/:userId
// @desc    Update registration status (for organizers)
// @access  Private (Shelter Admin only)
router.put('/:id/registration/:userId', 
    protect, 
    authorize('shelter_admin', 'admin'),
    logUserActivity('registration_status_updated'),
    [
        body('status')
            .isIn(['confirmed', 'waitlist', 'cancelled'])
            .withMessage('Invalid registration status'),
        body('notes')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Notes must not exceed 500 characters')
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

            const activity = await Activity.findById(req.params.id);

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            // Find registration
            const registration = activity.registrations.find(
                reg => reg.user.toString() === req.params.userId
            );

            if (!registration) {
                return res.status(404).json({
                    success: false,
                    message: 'Registration not found'
                });
            }

            // Update registration
            registration.status = req.body.status;
            if (req.body.notes) registration.notes = req.body.notes;

            await activity.save();

            res.json({
                success: true,
                message: 'Registration status updated successfully',
                registration: registration
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/activities/:id/registrations
// @desc    Get all registrations for an activity
// @access  Private (Shelter Admin only)
router.get('/:id/registrations', 
    protect, 
    authorize('shelter_admin', 'admin'),
    async (req, res, next) => {
        try {
            const activity = await Activity.findById(req.params.id)
                .populate('registrations.user', 'firstName lastName email phone');

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            res.json({
                success: true,
                registrations: activity.registrations,
                totalRegistrations: activity.registrations.length,
                capacity: activity.capacity
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   DELETE /api/activities/:id
// @desc    Delete an activity
// @access  Private (Shelter Admin only)
router.delete('/:id', 
    protect, 
    authorize('shelter_admin', 'admin'),
    logUserActivity('activity_deleted'),
    async (req, res, next) => {
        try {
            const activity = await Activity.findById(req.params.id);

            if (!activity) {
                return res.status(404).json({
                    success: false,
                    message: 'Activity not found'
                });
            }

            // Check if activity has registrations and is in the future
            if (activity.registrations.length > 0 && new Date(activity.startDate) > new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete future activities with existing registrations'
                });
            }

            await Activity.findByIdAndDelete(req.params.id);

            res.json({
                success: true,
                message: 'Activity deleted successfully'
            });

        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;