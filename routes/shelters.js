const express = require('express');
const { body, query } = require('express-validator');
const Shelter = require('../models/Shelter');
const Pet = require('../models/Pet');
const Activity = require('../models/Activity');
const { protect, authorize, logUserActivity } = require('../middleware/auth');
const { validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/shelters
// @desc    Get all shelters with filters and pagination
// @access  Public
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('state').optional().isString().withMessage('State must be a string'),
    query('city').optional().isString().withMessage('City must be a string'),
    query('zip').optional().isString().withMessage('ZIP code must be a string'),
    query('search').optional().isString().withMessage('Search term must be a string'),
    query('verified').optional().isBoolean().withMessage('Verified must be true or false')
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
            state,
            city,
            zip,
            search,
            verified
        } = req.query;

        // Build query
        let query = {};

        if (state) query['address.state'] = new RegExp(state, 'i');
        if (city) query['address.city'] = new RegExp(city, 'i');
        if (zip) query['address.zip'] = zip;
        if (verified !== undefined) query.isVerified = verified === 'true';

        // Search filter
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') },
                { 'address.city': new RegExp(search, 'i') },
                { 'address.state': new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const shelters = await Shelter.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Shelter.countDocuments(query);

        // Get pet counts for each shelter
        const sheltersWithCounts = await Promise.all(
            shelters.map(async (shelter) => {
                const petCount = await Pet.countDocuments({
                    shelter: shelter._id,
                    'adoption.status': 'available'
                });
                return {
                    ...shelter.toObject(),
                    availablePets: petCount
                };
            })
        );

        res.json({
            success: true,
            count: shelters.length,
            total: total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            shelters: sheltersWithCounts
        });

    } catch (error) {
        next(error);
    }
});

// @route   GET /api/shelters/:id
// @desc    Get single shelter by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        const shelter = await Shelter.findById(req.params.id);

        if (!shelter) {
            return res.status(404).json({
                success: false,
                message: 'Shelter not found'
            });
        }

        // Get shelter statistics
        const [petCount, activityCount, adoptionCount] = await Promise.all([
            Pet.countDocuments({ shelter: shelter._id, 'adoption.status': 'available' }),
            Activity.countDocuments({ shelter: shelter._id, startDate: { $gte: new Date() } }),
            Pet.countDocuments({ shelter: shelter._id, 'adoption.status': 'adopted' })
        ]);

        const shelterResponse = {
            ...shelter.toObject(),
            stats: {
                availablePets: petCount,
                upcomingActivities: activityCount,
                successfulAdoptions: adoptionCount
            }
        };

        res.json({
            success: true,
            shelter: shelterResponse
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/shelters
// @desc    Create a new shelter
// @access  Private (Admin only)
router.post('/', 
    protect, 
    authorize('admin'),
    logUserActivity('shelter_created'),
    [
        body('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Shelter name must be between 2 and 100 characters'),
        body('description')
            .trim()
            .isLength({ min: 20, max: 1000 })
            .withMessage('Description must be between 20 and 1000 characters'),
        body('contact.email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please enter a valid email address'),
        body('contact.phone')
            .matches(/^\+?[\d\s\-\(\)]+$/)
            .withMessage('Please enter a valid phone number'),
        body('address.street')
            .trim()
            .isLength({ min: 5, max: 100 })
            .withMessage('Street address must be between 5 and 100 characters'),
        body('address.city')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('City must be between 2 and 50 characters'),
        body('address.state')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('State must be between 2 and 50 characters'),
        body('address.zip')
            .matches(/^\d{5}(-\d{4})?$/)
            .withMessage('Please enter a valid ZIP code'),
        body('website')
            .optional()
            .isURL()
            .withMessage('Please enter a valid website URL')
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

            // Check if shelter name already exists
            const existingShelter = await Shelter.findOne({ 
                name: new RegExp(`^${req.body.name}$`, 'i') 
            });

            if (existingShelter) {
                return res.status(400).json({
                    success: false,
                    message: 'A shelter with this name already exists'
                });
            }

            // Create shelter
            const shelter = await Shelter.create(req.body);

            res.status(201).json({
                success: true,
                message: 'Shelter created successfully',
                shelter: shelter
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   PUT /api/shelters/:id
// @desc    Update shelter information
// @access  Private (Shelter Admin or System Admin)
router.put('/:id', 
    protect, 
    authorize('shelter_admin', 'admin'),
    logUserActivity('shelter_updated'),
    [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Shelter name must be between 2 and 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ min: 20, max: 1000 })
            .withMessage('Description must be between 20 and 1000 characters'),
        body('contact.email')
            .optional()
            .isEmail()
            .normalizeEmail()
            .withMessage('Please enter a valid email address'),
        body('contact.phone')
            .optional()
            .matches(/^\+?[\d\s\-\(\)]+$/)
            .withMessage('Please enter a valid phone number'),
        body('address.street')
            .optional()
            .trim()
            .isLength({ min: 5, max: 100 })
            .withMessage('Street address must be between 5 and 100 characters'),
        body('address.city')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('City must be between 2 and 50 characters'),
        body('address.state')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('State must be between 2 and 50 characters'),
        body('address.zip')
            .optional()
            .matches(/^\d{5}(-\d{4})?$/)
            .withMessage('Please enter a valid ZIP code'),
        body('website')
            .optional()
            .isURL()
            .withMessage('Please enter a valid website URL')
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

            const shelter = await Shelter.findById(req.params.id);

            if (!shelter) {
                return res.status(404).json({
                    success: false,
                    message: 'Shelter not found'
                });
            }

            // Update shelter
            const updatedShelter = await Shelter.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            res.json({
                success: true,
                message: 'Shelter information updated successfully',
                shelter: updatedShelter
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/shelters/:id/pets
// @desc    Get all pets for a specific shelter
// @access  Public
router.get('/:id/pets', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['available', 'pending', 'adopted', 'not_available']).withMessage('Invalid status'),
    query('type').optional().isIn(['dog', 'cat', 'rabbit', 'bird', 'other']).withMessage('Invalid pet type')
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

        const shelter = await Shelter.findById(req.params.id);

        if (!shelter) {
            return res.status(404).json({
                success: false,
                message: 'Shelter not found'
            });
        }

        const {
            page = 1,
            limit = 12,
            status = 'available',
            type
        } = req.query;

        // Build query
        let query = { shelter: req.params.id, 'adoption.status': status };
        if (type) query.type = type;

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const pets = await Pet.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Pet.countDocuments(query);

        res.json({
            success: true,
            shelter: {
                name: shelter.name,
                id: shelter._id
            },
            count: pets.length,
            total: total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            pets: pets
        });

    } catch (error) {
        next(error);
    }
});

// @route   GET /api/shelters/:id/activities
// @desc    Get all activities for a specific shelter
// @access  Public
router.get('/:id/activities', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('upcoming').optional().isBoolean().withMessage('Upcoming must be true or false'),
    query('type').optional().isIn(['adoption_event', 'fundraiser', 'training', 'volunteer', 'educational', 'social']).withMessage('Invalid activity type')
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

        const shelter = await Shelter.findById(req.params.id);

        if (!shelter) {
            return res.status(404).json({
                success: false,
                message: 'Shelter not found'
            });
        }

        const {
            page = 1,
            limit = 12,
            upcoming,
            type
        } = req.query;

        // Build query
        let query = { shelter: req.params.id };
        if (type) query.type = type;
        if (upcoming === 'true') {
            query.startDate = { $gte: new Date() };
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const activities = await Activity.find(query)
            .sort({ startDate: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Activity.countDocuments(query);

        res.json({
            success: true,
            shelter: {
                name: shelter.name,
                id: shelter._id
            },
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

// @route   PUT /api/shelters/:id/verify
// @desc    Verify/unverify a shelter
// @access  Private (Admin only)
router.put('/:id/verify', 
    protect, 
    authorize('admin'),
    logUserActivity('shelter_verification'),
    [
        body('isVerified')
            .isBoolean()
            .withMessage('isVerified must be true or false'),
        body('verificationNotes')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Verification notes must not exceed 500 characters')
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

            const shelter = await Shelter.findById(req.params.id);

            if (!shelter) {
                return res.status(404).json({
                    success: false,
                    message: 'Shelter not found'
                });
            }

            // Update verification status
            shelter.isVerified = req.body.isVerified;
            shelter.verifiedDate = req.body.isVerified ? new Date() : null;
            shelter.verifiedBy = req.body.isVerified ? req.user.id : null;
            
            if (req.body.verificationNotes) {
                shelter.verificationNotes = req.body.verificationNotes;
            }

            await shelter.save();

            res.json({
                success: true,
                message: `Shelter ${req.body.isVerified ? 'verified' : 'unverified'} successfully`,
                shelter: shelter
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/shelters/:id/dashboard
// @desc    Get shelter dashboard statistics
// @access  Private (Shelter Admin or System Admin)
router.get('/:id/dashboard', 
    protect, 
    authorize('shelter_admin', 'admin'),
    async (req, res, next) => {
        try {
            const shelter = await Shelter.findById(req.params.id);

            if (!shelter) {
                return res.status(404).json({
                    success: false,
                    message: 'Shelter not found'
                });
            }

            // Get comprehensive statistics
            const [
                totalPets,
                availablePets,
                adoptedPets,
                pendingPets,
                totalActivities,
                upcomingActivities,
                totalRegistrations
            ] = await Promise.all([
                Pet.countDocuments({ shelter: req.params.id }),
                Pet.countDocuments({ shelter: req.params.id, 'adoption.status': 'available' }),
                Pet.countDocuments({ shelter: req.params.id, 'adoption.status': 'adopted' }),
                Pet.countDocuments({ shelter: req.params.id, 'adoption.status': 'pending' }),
                Activity.countDocuments({ shelter: req.params.id }),
                Activity.countDocuments({ 
                    shelter: req.params.id, 
                    startDate: { $gte: new Date() } 
                }),
                Activity.aggregate([
                    { $match: { shelter: require('mongoose').Types.ObjectId(req.params.id) } },
                    { $unwind: '$registrations' },
                    { $count: 'totalRegistrations' }
                ])
            ]);

            // Recent pets (last 30 days)
            const recentPets = await Pet.find({
                shelter: req.params.id,
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }).sort({ createdAt: -1 }).limit(5);

            // Recent activities
            const recentActivities = await Activity.find({
                shelter: req.params.id,
                startDate: { $gte: new Date() }
            }).sort({ startDate: 1 }).limit(5);

            const dashboardData = {
                shelter: {
                    name: shelter.name,
                    id: shelter._id,
                    isVerified: shelter.isVerified
                },
                stats: {
                    pets: {
                        total: totalPets,
                        available: availablePets,
                        adopted: adoptedPets,
                        pending: pendingPets
                    },
                    activities: {
                        total: totalActivities,
                        upcoming: upcomingActivities,
                        totalRegistrations: totalRegistrations[0]?.totalRegistrations || 0
                    }
                },
                recent: {
                    pets: recentPets,
                    activities: recentActivities
                }
            };

            res.json({
                success: true,
                dashboard: dashboardData
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   DELETE /api/shelters/:id
// @desc    Delete a shelter (soft delete)
// @access  Private (Admin only)
router.delete('/:id', 
    protect, 
    authorize('admin'),
    logUserActivity('shelter_deleted'),
    async (req, res, next) => {
        try {
            const shelter = await Shelter.findById(req.params.id);

            if (!shelter) {
                return res.status(404).json({
                    success: false,
                    message: 'Shelter not found'
                });
            }

            // Check if shelter has active pets or activities
            const [activePets, futureActivities] = await Promise.all([
                Pet.countDocuments({ 
                    shelter: req.params.id, 
                    'adoption.status': { $in: ['available', 'pending'] } 
                }),
                Activity.countDocuments({ 
                    shelter: req.params.id, 
                    startDate: { $gte: new Date() } 
                })
            ]);

            if (activePets > 0 || futureActivities > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete shelter with active pets or future activities'
                });
            }

            // Soft delete - mark as inactive
            shelter.isActive = false;
            await shelter.save();

            res.json({
                success: true,
                message: 'Shelter deactivated successfully'
            });

        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;