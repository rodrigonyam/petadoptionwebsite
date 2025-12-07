const express = require('express');
const { body, query } = require('express-validator');
const Pet = require('../models/Pet');
const { protect, authorize, logUserActivity } = require('../middleware/auth');
const { validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/pets
// @desc    Get all pets with filters and pagination
// @access  Public
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['dog', 'cat', 'rabbit', 'bird', 'other']).withMessage('Invalid pet type'),
    query('breed').optional().isString().withMessage('Breed must be a string'),
    query('age').optional().isIn(['young', 'adult', 'senior']).withMessage('Invalid age category'),
    query('size').optional().isIn(['small', 'medium', 'large', 'extra-large']).withMessage('Invalid size category'),
    query('gender').optional().isIn(['male', 'female', 'unknown']).withMessage('Invalid gender'),
    query('goodWith').optional().isIn(['children', 'dogs', 'cats']).withMessage('Invalid goodWith filter'),
    query('specialNeeds').optional().isBoolean().withMessage('Special needs must be true or false'),
    query('shelter').optional().isMongoId().withMessage('Invalid shelter ID'),
    query('search').optional().isString().withMessage('Search term must be a string'),
    query('minFee').optional().isFloat({ min: 0 }).withMessage('Minimum fee must be a positive number'),
    query('maxFee').optional().isFloat({ min: 0 }).withMessage('Maximum fee must be a positive number')
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
            breed,
            age,
            size,
            gender,
            goodWith,
            specialNeeds,
            shelter,
            search,
            minFee,
            maxFee,
            status = 'available'
        } = req.query;

        // Build query
        let query = { 'adoption.status': status };

        if (type) query.type = type;
        if (breed) query.breed = new RegExp(breed, 'i');
        if (age) query.age = age;
        if (size) query.size = size;
        if (gender) query.gender = gender;
        if (shelter) query.shelter = shelter;
        if (specialNeeds !== undefined) query.specialNeeds = specialNeeds === 'true';

        // Good with filters
        if (goodWith) {
            query[`goodWith.${goodWith}`] = true;
        }

        // Fee range filter
        if (minFee !== undefined || maxFee !== undefined) {
            query['adoption.fee'] = {};
            if (minFee !== undefined) query['adoption.fee'].$gte = parseFloat(minFee);
            if (maxFee !== undefined) query['adoption.fee'].$lte = parseFloat(maxFee);
        }

        // Search filter
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { breed: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }

        // Execute query with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const pets = await Pet.find(query)
            .populate('shelter', 'name contact.email contact.phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Pet.countDocuments(query);

        res.json({
            success: true,
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

// @route   GET /api/pets/:id
// @desc    Get single pet by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
    try {
        const pet = await Pet.findById(req.params.id)
            .populate('shelter', 'name contact address website description')
            .populate('adoptionHistory.adoptedBy', 'firstName lastName');

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Increment view count
        pet.views += 1;
        await pet.save();

        res.json({
            success: true,
            pet: pet
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/pets
// @desc    Create a new pet listing
// @access  Private (Shelter Admin only)
router.post('/', 
    protect, 
    authorize('shelter_admin', 'admin'),
    logUserActivity('pet_created'),
    [
        body('name')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Pet name must be between 2 and 50 characters'),
        body('type')
            .isIn(['dog', 'cat', 'rabbit', 'bird', 'other'])
            .withMessage('Invalid pet type'),
        body('breed')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Breed must be between 2 and 50 characters'),
        body('age')
            .isIn(['young', 'adult', 'senior'])
            .withMessage('Invalid age category'),
        body('size')
            .isIn(['small', 'medium', 'large', 'extra-large'])
            .withMessage('Invalid size category'),
        body('gender')
            .isIn(['male', 'female', 'unknown'])
            .withMessage('Invalid gender'),
        body('description')
            .trim()
            .isLength({ min: 50, max: 1000 })
            .withMessage('Description must be between 50 and 1000 characters'),
        body('adoption.fee')
            .isFloat({ min: 0 })
            .withMessage('Adoption fee must be a positive number'),
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

            // Create pet
            const pet = await Pet.create({
                ...req.body,
                addedBy: req.user.id
            });

            // Populate shelter information
            await pet.populate('shelter', 'name contact.email contact.phone');

            res.status(201).json({
                success: true,
                message: 'Pet listing created successfully',
                pet: pet
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   PUT /api/pets/:id
// @desc    Update pet information
// @access  Private (Shelter Admin only)
router.put('/:id', 
    protect, 
    authorize('shelter_admin', 'admin'),
    logUserActivity('pet_updated'),
    [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Pet name must be between 2 and 50 characters'),
        body('type')
            .optional()
            .isIn(['dog', 'cat', 'rabbit', 'bird', 'other'])
            .withMessage('Invalid pet type'),
        body('breed')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Breed must be between 2 and 50 characters'),
        body('age')
            .optional()
            .isIn(['young', 'adult', 'senior'])
            .withMessage('Invalid age category'),
        body('size')
            .optional()
            .isIn(['small', 'medium', 'large', 'extra-large'])
            .withMessage('Invalid size category'),
        body('gender')
            .optional()
            .isIn(['male', 'female', 'unknown'])
            .withMessage('Invalid gender'),
        body('description')
            .optional()
            .trim()
            .isLength({ min: 50, max: 1000 })
            .withMessage('Description must be between 50 and 1000 characters'),
        body('adoption.fee')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Adoption fee must be a positive number')
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

            const pet = await Pet.findById(req.params.id);

            if (!pet) {
                return res.status(404).json({
                    success: false,
                    message: 'Pet not found'
                });
            }

            // Update pet
            const updatedPet = await Pet.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            ).populate('shelter', 'name contact.email contact.phone');

            res.json({
                success: true,
                message: 'Pet information updated successfully',
                pet: updatedPet
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   POST /api/pets/:id/favorite
// @desc    Add/remove pet from user's favorites
// @access  Private
router.post('/:id/favorite', protect, logUserActivity('pet_favorited'), async (req, res, next) => {
    try {
        const pet = await Pet.findById(req.params.id);

        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        const User = require('../models/User');
        const user = await User.findById(req.user.id);

        const isFavorited = user.favorites.includes(pet._id);

        if (isFavorited) {
            // Remove from favorites
            user.favorites = user.favorites.filter(fav => !fav.equals(pet._id));
        } else {
            // Add to favorites
            user.favorites.push(pet._id);
        }

        await user.save();

        res.json({
            success: true,
            message: isFavorited ? 'Removed from favorites' : 'Added to favorites',
            favorited: !isFavorited
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/pets/:id/adoption-request
// @desc    Submit adoption request for a pet
// @access  Private
router.post('/:id/adoption-request', 
    protect, 
    logUserActivity('adoption_request'),
    [
        body('message')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Message must not exceed 500 characters'),
        body('experience')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Experience description must not exceed 1000 characters'),
        body('livingSpace')
            .optional()
            .isIn(['apartment', 'house_small_yard', 'house_large_yard', 'farm'])
            .withMessage('Invalid living space type'),
        body('hasOtherPets')
            .optional()
            .isBoolean()
            .withMessage('hasOtherPets must be true or false'),
        body('hasChildren')
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

            const pet = await Pet.findById(req.params.id);

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
            const Adoption = require('../models/Adoption');
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
            const adoptionRequest = await Adoption.create({
                pet: pet._id,
                adopter: req.user.id,
                shelter: pet.shelter,
                adoptionDetails: {
                    message: req.body.message || '',
                    experience: req.body.experience || '',
                    livingSpace: req.body.livingSpace,
                    hasOtherPets: req.body.hasOtherPets || false,
                    hasChildren: req.body.hasChildren || false
                }
            });

            // Populate the adoption request
            await adoptionRequest.populate('pet', 'name type breed');
            await adoptionRequest.populate('adopter', 'firstName lastName email');

            res.status(201).json({
                success: true,
                message: 'Adoption request submitted successfully',
                adoptionRequest: adoptionRequest
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   PUT /api/pets/:id/status
// @desc    Update pet adoption status
// @access  Private (Shelter Admin only)
router.put('/:id/status', 
    protect, 
    authorize('shelter_admin', 'admin'),
    logUserActivity('pet_status_updated'),
    [
        body('status')
            .isIn(['available', 'pending', 'adopted', 'not_available'])
            .withMessage('Invalid status'),
        body('adoptedBy')
            .optional()
            .isMongoId()
            .withMessage('Invalid adopter ID')
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

            const { status, adoptedBy } = req.body;
            const pet = await Pet.findById(req.params.id);

            if (!pet) {
                return res.status(404).json({
                    success: false,
                    message: 'Pet not found'
                });
            }

            // Update adoption status
            pet.adoption.status = status;

            if (status === 'adopted' && adoptedBy) {
                pet.adoption.adoptedBy = adoptedBy;
                pet.adoption.adoptedDate = new Date();
                
                // Add to adoption history
                pet.adoptionHistory.push({
                    adoptedBy: adoptedBy,
                    adoptedDate: new Date(),
                    status: 'completed'
                });
            }

            await pet.save();

            res.json({
                success: true,
                message: `Pet status updated to ${status}`,
                pet: pet
            });

        } catch (error) {
            next(error);
        }
    }
);

// @route   DELETE /api/pets/:id
// @desc    Delete pet listing
// @access  Private (Shelter Admin only)
router.delete('/:id', 
    protect, 
    authorize('shelter_admin', 'admin'),
    logUserActivity('pet_deleted'),
    async (req, res, next) => {
        try {
            const pet = await Pet.findById(req.params.id);

            if (!pet) {
                return res.status(404).json({
                    success: false,
                    message: 'Pet not found'
                });
            }

            // Check if pet has pending adoptions
            const Adoption = require('../models/Adoption');
            const pendingAdoptions = await Adoption.countDocuments({
                pet: pet._id,
                status: { $in: ['pending', 'approved'] }
            });

            if (pendingAdoptions > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete pet with pending adoption requests'
                });
            }

            await Pet.findByIdAndDelete(req.params.id);

            res.json({
                success: true,
                message: 'Pet listing deleted successfully'
            });

        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;