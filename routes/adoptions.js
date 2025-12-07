const express = require('express');
const { body, query } = require('express-validator');
const Adoption = require('../models/Adoption');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { protect, authorize, logUserActivity } = require('../middleware/auth');
const { validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/adoptions
// @desc    Get adoption requests with filters and pagination
// @access  Private (Shelter Admin/Admin for all, Users for their own)
router.get('/', 
    protect,
    [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isIn(['pending', 'approved', 'rejected', 'completed', 'cancelled']).withMessage('Invalid status'),
        query('shelter').optional().isMongoId().withMessage('Invalid shelter ID'),
        query('pet').optional().isMongoId().withMessage('Invalid pet ID'),
        query('adopter').optional().isMongoId().withMessage('Invalid adopter ID')
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
                limit = 10,
                status,
                shelter,
                pet,
                adopter
            } = req.query;

            // Build query based on user role
            let query = {};

            // Regular users can only see their own adoption requests
            if (req.user.role === 'user') {
                query.adopter = req.user.id;
            } else {
                // Shelter admins and system admins can filter by various criteria
                if (status) query.status = status;
                if (shelter) query.shelter = shelter;
                if (pet) query.pet = pet;
                if (adopter) query.adopter = adopter;
            }

            // Execute query with pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);
            
            const adoptions = await Adoption.find(query)
                .populate('pet', 'name type breed images adoption.fee')
                .populate('adopter', 'firstName lastName email phone')
                .populate('shelter', 'name contact.email contact.phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const total = await Adoption.countDocuments(query);

            res.json({
                success: true,
                count: adoptions.length,
                total: total,
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page),
                adoptions: adoptions
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/adoptions/:id
// @desc    Get single adoption request by ID
// @access  Private (Owner, Shelter Admin, or System Admin)
router.get('/:id', protect, async (req, res, next) => {
    try {
        const adoption = await Adoption.findById(req.params.id)
            .populate('pet', 'name type breed images adoption.fee description')
            .populate('adopter', 'firstName lastName email phone address profile')
            .populate('shelter', 'name contact address description');

        if (!adoption) {
            return res.status(404).json({
                success: false,
                message: 'Adoption request not found'
            });
        }

        // Check if user has permission to view this adoption
        if (req.user.role === 'user' && adoption.adopter._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this adoption request'
            });
        }

        res.json({
            success: true,
            adoption: adoption
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/adoptions
// @desc    Create a new adoption request
// @access  Private
router.post('/', 
    protect, 
    logUserActivity('adoption_request_created'),
    [
        body('pet')
            .isMongoId()
            .withMessage('Invalid pet ID'),
        body('adoptionDetails.message')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Message must not exceed 500 characters'),
        body('adoptionDetails.experience')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Experience description must not exceed 1000 characters'),
        body('adoptionDetails.livingSpace')
            .optional()
            .isIn(['apartment', 'house_small_yard', 'house_large_yard', 'farm'])
            .withMessage('Invalid living space type'),
        body('adoptionDetails.hasOtherPets')
            .optional()
            .isBoolean()
            .withMessage('hasOtherPets must be true or false'),
        body('adoptionDetails.hasChildren')
            .optional()
            .isBoolean()
            .withMessage('hasChildren must be true or false')
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

            const pet = await Pet.findById(req.body.pet).populate('shelter');

            if (!pet) {
                return res.status(404).json({
                    success: false,
                    message: 'Pet not found'
                });
            }

            if (pet.adoption.status !== 'available') {
                return res.status(400).json({
                    success: false,
                    message: 'This pet is not available for adoption'
                });
            }

            // Check if user has already submitted a request for this pet
            const existingRequest = await Adoption.findOne({
                pet: pet._id,
                adopter: req.user.id,
                status: { $in: ['pending', 'approved'] }
            });

            if (existingRequest) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already submitted an adoption request for this pet'
                });
            }

            // Create adoption request
            const adoption = await Adoption.create({
                pet: pet._id,
                adopter: req.user.id,
                shelter: pet.shelter._id,
                adoptionDetails: req.body.adoptionDetails || {}
            });

            // Populate the adoption request
            await adoption.populate('pet', 'name type breed images');
            await adoption.populate('adopter', 'firstName lastName email');
            await adoption.populate('shelter', 'name contact.email');

            res.status(201).json({
                success: true,
                message: 'Adoption request submitted successfully',
                adoption: adoption
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   PUT /api/adoptions/:id/status
// @desc    Update adoption request status
// @access  Private (Shelter Admin or System Admin)
router.put('/:id/status', 
    protect, 
    authorize('shelter_admin', 'admin'),
    logUserActivity('adoption_status_updated'),
    [
        body('status')
            .isIn(['pending', 'approved', 'rejected', 'completed', 'cancelled'])
            .withMessage('Invalid status'),
        body('notes')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Notes must not exceed 1000 characters'),
        body('scheduledMeetingDate')
            .optional()
            .isISO8601()
            .withMessage('Meeting date must be a valid date'),
        body('rejectionReason')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Rejection reason must not exceed 500 characters')
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

            const { status, notes, scheduledMeetingDate, rejectionReason } = req.body;

            const adoption = await Adoption.findById(req.params.id)
                .populate('pet')
                .populate('adopter', 'firstName lastName email');

            if (!adoption) {
                return res.status(404).json({
                    success: false,
                    message: 'Adoption request not found'
                });
            }

            // Update adoption status
            adoption.status = status;
            
            if (notes) adoption.shelterNotes = notes;
            if (scheduledMeetingDate) adoption.scheduledMeetingDate = new Date(scheduledMeetingDate);
            if (rejectionReason && status === 'rejected') adoption.rejectionReason = rejectionReason;

            // Update timestamps based on status
            switch (status) {
                case 'approved':
                    adoption.approvedDate = new Date();
                    break;
                case 'rejected':
                    adoption.rejectedDate = new Date();
                    break;
                case 'completed':
                    adoption.completedDate = new Date();
                    // Update pet status to adopted
                    adoption.pet.adoption.status = 'adopted';
                    adoption.pet.adoption.adoptedBy = adoption.adopter._id;
                    adoption.pet.adoption.adoptedDate = new Date();
                    
                    // Add to pet's adoption history
                    adoption.pet.adoptionHistory.push({
                        adoptedBy: adoption.adopter._id,
                        adoptedDate: new Date(),
                        status: 'completed'
                    });
                    
                    await adoption.pet.save();
                    break;
            }

            await adoption.save();

            res.json({
                success: true,
                message: `Adoption request ${status} successfully`,
                adoption: adoption
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   PUT /api/adoptions/:id
// @desc    Update adoption request details (by adopter)
// @access  Private (Adopter only, and only for pending requests)
router.put('/:id', 
    protect, 
    logUserActivity('adoption_request_updated'),
    [
        body('adoptionDetails.message')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Message must not exceed 500 characters'),
        body('adoptionDetails.experience')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Experience description must not exceed 1000 characters'),
        body('adoptionDetails.livingSpace')
            .optional()
            .isIn(['apartment', 'house_small_yard', 'house_large_yard', 'farm'])
            .withMessage('Invalid living space type'),
        body('adoptionDetails.hasOtherPets')
            .optional()
            .isBoolean()
            .withMessage('hasOtherPets must be true or false'),
        body('adoptionDetails.hasChildren')
            .optional()
            .isBoolean()
            .withMessage('hasChildren must be true or false')
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

            const adoption = await Adoption.findById(req.params.id);

            if (!adoption) {
                return res.status(404).json({
                    success: false,
                    message: 'Adoption request not found'
                });
            }

            // Check if user owns this adoption request
            if (adoption.adopter.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this adoption request'
                });
            }

            // Only allow updates for pending requests
            if (adoption.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Can only update pending adoption requests'
                });
            }

            // Update adoption details
            if (req.body.adoptionDetails) {
                adoption.adoptionDetails = {
                    ...adoption.adoptionDetails.toObject(),
                    ...req.body.adoptionDetails
                };
            }

            await adoption.save();

            res.json({
                success: true,
                message: 'Adoption request updated successfully',
                adoption: adoption
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   DELETE /api/adoptions/:id
// @desc    Cancel/withdraw adoption request
// @access  Private (Adopter or Admin)
router.delete('/:id', 
    protect, 
    logUserActivity('adoption_request_cancelled'),
    async (req, res, next) => {
        try {
            const adoption = await Adoption.findById(req.params.id);

            if (!adoption) {
                return res.status(404).json({
                    success: false,
                    message: 'Adoption request not found'
                });
            }

            // Check permissions
            const isOwner = adoption.adopter.toString() === req.user.id;
            const isAdmin = ['admin', 'shelter_admin'].includes(req.user.role);

            if (!isOwner && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to cancel this adoption request'
                });
            }

            // Can only cancel pending or approved requests
            if (!['pending', 'approved'].includes(adoption.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Can only cancel pending or approved adoption requests'
                });
            }

            // Update status to cancelled
            adoption.status = 'cancelled';
            adoption.cancelledDate = new Date();
            await adoption.save();

            res.json({
                success: true,
                message: 'Adoption request cancelled successfully'
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   GET /api/adoptions/stats
// @desc    Get adoption statistics
// @access  Private (Admin only)
router.get('/stats/overview', 
    protect, 
    authorize('admin'),
    async (req, res, next) => {
        try {
            const [
                totalRequests,
                pendingRequests,
                approvedRequests,
                completedAdoptions,
                rejectedRequests,
                cancelledRequests
            ] = await Promise.all([
                Adoption.countDocuments(),
                Adoption.countDocuments({ status: 'pending' }),
                Adoption.countDocuments({ status: 'approved' }),
                Adoption.countDocuments({ status: 'completed' }),
                Adoption.countDocuments({ status: 'rejected' }),
                Adoption.countDocuments({ status: 'cancelled' })
            ]);

            // Get monthly adoption trends (last 12 months)
            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

            const monthlyTrends = await Adoption.aggregate([
                {
                    $match: {
                        createdAt: { $gte: twelveMonthsAgo },
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$completedDate' },
                            month: { $month: '$completedDate' }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { '_id.year': 1, '_id.month': 1 }
                }
            ]);

            // Most popular pet types
            const petTypeStats = await Adoption.aggregate([
                {
                    $match: { status: 'completed' }
                },
                {
                    $lookup: {
                        from: 'pets',
                        localField: 'pet',
                        foreignField: '_id',
                        as: 'petInfo'
                    }
                },
                {
                    $unwind: '$petInfo'
                },
                {
                    $group: {
                        _id: '$petInfo.type',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ]);

            const stats = {
                overview: {
                    total: totalRequests,
                    pending: pendingRequests,
                    approved: approvedRequests,
                    completed: completedAdoptions,
                    rejected: rejectedRequests,
                    cancelled: cancelledRequests,
                    successRate: totalRequests > 0 ? ((completedAdoptions / totalRequests) * 100).toFixed(2) : 0
                },
                monthlyTrends: monthlyTrends,
                petTypeStats: petTypeStats
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

// @route   GET /api/adoptions/:id/timeline
// @desc    Get adoption request timeline/history
// @access  Private (Adopter, Shelter Admin, or System Admin)
router.get('/:id/timeline', protect, async (req, res, next) => {
    try {
        const adoption = await Adoption.findById(req.params.id);

        if (!adoption) {
            return res.status(404).json({
                success: false,
                message: 'Adoption request not found'
            });
        }

        // Check permissions
        const isOwner = adoption.adopter.toString() === req.user.id;
        const isAdmin = ['admin', 'shelter_admin'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this adoption timeline'
            });
        }

        // Build timeline from adoption data
        const timeline = [
            {
                event: 'Application Submitted',
                date: adoption.createdAt,
                status: 'completed'
            }
        ];

        if (adoption.approvedDate) {
            timeline.push({
                event: 'Application Approved',
                date: adoption.approvedDate,
                status: 'completed'
            });
        }

        if (adoption.scheduledMeetingDate) {
            timeline.push({
                event: 'Meeting Scheduled',
                date: adoption.scheduledMeetingDate,
                status: new Date(adoption.scheduledMeetingDate) > new Date() ? 'upcoming' : 'completed'
            });
        }

        if (adoption.completedDate) {
            timeline.push({
                event: 'Adoption Completed',
                date: adoption.completedDate,
                status: 'completed'
            });
        }

        if (adoption.rejectedDate) {
            timeline.push({
                event: 'Application Rejected',
                date: adoption.rejectedDate,
                status: 'rejected',
                reason: adoption.rejectionReason
            });
        }

        if (adoption.cancelledDate) {
            timeline.push({
                event: 'Application Cancelled',
                date: adoption.cancelledDate,
                status: 'cancelled'
            });
        }

        // Sort timeline by date
        timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            success: true,
            timeline: timeline,
            currentStatus: adoption.status
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;