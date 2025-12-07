const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Pet name is required'],
        trim: true,
        maxlength: [50, 'Pet name cannot exceed 50 characters']
    },
    type: {
        type: String,
        required: [true, 'Pet type is required'],
        enum: ['cat', 'dog', 'rabbit', 'bird', 'other'],
        lowercase: true
    },
    breed: {
        type: String,
        required: [true, 'Pet breed is required'],
        trim: true,
        maxlength: [100, 'Breed cannot exceed 100 characters']
    },
    age: {
        years: {
            type: Number,
            min: [0, 'Age cannot be negative'],
            max: [30, 'Age seems too high']
        },
        months: {
            type: Number,
            min: [0, 'Months cannot be negative'],
            max: [11, 'Months cannot exceed 11']
        },
        ageGroup: {
            type: String,
            enum: ['baby', 'young', 'adult', 'senior'],
            required: true
        }
    },
    gender: {
        type: String,
        required: [true, 'Pet gender is required'],
        enum: ['male', 'female', 'unknown']
    },
    size: {
        type: String,
        required: [true, 'Pet size is required'],
        enum: ['small', 'medium', 'large', 'extra-large']
    },
    weight: {
        type: Number,
        min: [0.1, 'Weight must be positive'],
        max: [500, 'Weight seems too high'] // in pounds
    },
    color: {
        primary: {
            type: String,
            required: [true, 'Primary color is required'],
            trim: true
        },
        secondary: {
            type: String,
            trim: true
        },
        pattern: {
            type: String,
            enum: ['solid', 'spotted', 'striped', 'mixed', 'other']
        }
    },
    description: {
        type: String,
        required: [true, 'Pet description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    personality: {
        traits: [{
            type: String,
            enum: [
                'friendly', 'calm', 'energetic', 'playful', 'gentle', 'protective',
                'independent', 'social', 'shy', 'confident', 'intelligent', 'loyal',
                'active', 'cuddly', 'vocal', 'quiet', 'trainable', 'adventurous'
            ]
        }],
        goodWith: {
            children: { type: Boolean, default: false },
            cats: { type: Boolean, default: false },
            dogs: { type: Boolean, default: false },
            strangers: { type: Boolean, default: false }
        },
        activityLevel: {
            type: String,
            enum: ['low', 'moderate', 'high', 'very-high'],
            required: true
        }
    },
    health: {
        vaccinations: {
            rabies: { type: Boolean, default: false },
            distemper: { type: Boolean, default: false },
            bordetella: { type: Boolean, default: false },
            flea: { type: Boolean, default: false },
            heartworm: { type: Boolean, default: false }
        },
        spayedNeutered: {
            type: Boolean,
            required: true
        },
        microchipped: {
            type: Boolean,
            default: false
        },
        specialNeeds: [{
            condition: String,
            description: String,
            medication: String,
            cost: Number
        }],
        veterinaryHistory: [{
            date: Date,
            procedure: String,
            veterinarian: String,
            notes: String
        }]
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        publicId: String, // For Cloudinary
        caption: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    adoption: {
        fee: {
            type: Number,
            required: [true, 'Adoption fee is required'],
            min: [0, 'Adoption fee cannot be negative']
        },
        status: {
            type: String,
            enum: ['available', 'pending', 'adopted', 'not-available', 'hold'],
            default: 'available'
        },
        availableDate: {
            type: Date,
            default: Date.now
        },
        adoptedDate: Date,
        adoptedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        applications: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            submittedAt: {
                type: Date,
                default: Date.now
            },
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected', 'withdrawn'],
                default: 'pending'
            },
            notes: String
        }],
        requirements: {
            homeVisit: {
                type: Boolean,
                default: false
            },
            experience: {
                type: String,
                enum: ['none', 'some', 'experienced', 'expert']
            },
            housing: [{
                type: String,
                enum: ['apartment', 'house', 'condo', 'farm']
            }],
            yard: {
                required: Boolean,
                fenced: Boolean
            }
        }
    },
    shelter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shelter',
        required: [true, 'Shelter is required']
    },
    location: {
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        zipCode: {
            type: String,
            trim: true
        }
    },
    featured: {
        type: Boolean,
        default: false
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    story: {
        type: String,
        maxlength: [1000, 'Story cannot exceed 1000 characters']
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance and search
petSchema.index({ type: 1, 'adoption.status': 1 });
petSchema.index({ 'location.city': 1, 'location.state': 1 });
petSchema.index({ breed: 1 });
petSchema.index({ 'adoption.fee': 1 });
petSchema.index({ featured: 1, 'adoption.status': 1 });
petSchema.index({ createdAt: -1 });
petSchema.index({ tags: 1 });

// Text index for search functionality
petSchema.index({
    name: 'text',
    breed: 'text',
    description: 'text',
    'personality.traits': 'text',
    tags: 'text'
});

// Virtual for age display
petSchema.virtual('ageDisplay').get(function() {
    if (this.age.years === 0) {
        return `${this.age.months} months`;
    } else if (this.age.months === 0) {
        return `${this.age.years} year${this.age.years > 1 ? 's' : ''}`;
    } else {
        return `${this.age.years} year${this.age.years > 1 ? 's' : ''} ${this.age.months} month${this.age.months > 1 ? 's' : ''}`;
    }
});

// Virtual for primary image
petSchema.virtual('primaryImage').get(function() {
    const primaryImg = this.images.find(img => img.isPrimary);
    return primaryImg ? primaryImg.url : (this.images.length > 0 ? this.images[0].url : null);
});

// Pre-save middleware
petSchema.pre('save', function(next) {
    // Ensure only one primary image
    if (this.images && this.images.length > 0) {
        let hasPrimary = false;
        this.images.forEach((img, index) => {
            if (img.isPrimary && !hasPrimary) {
                hasPrimary = true;
            } else if (img.isPrimary && hasPrimary) {
                img.isPrimary = false;
            }
        });
        
        // If no primary image, set first as primary
        if (!hasPrimary && this.images.length > 0) {
            this.images[0].isPrimary = true;
        }
    }
    
    next();
});

// Static methods for search and filtering
petSchema.statics.findAvailable = function() {
    return this.find({ 'adoption.status': 'available' });
};

petSchema.statics.findByType = function(type) {
    return this.find({ type: type.toLowerCase(), 'adoption.status': 'available' });
};

petSchema.statics.findByLocation = function(city, state) {
    return this.find({
        'location.city': new RegExp(city, 'i'),
        'location.state': new RegExp(state, 'i'),
        'adoption.status': 'available'
    });
};

petSchema.statics.searchPets = function(query) {
    return this.find({
        $text: { $search: query },
        'adoption.status': 'available'
    }, {
        score: { $meta: 'textScore' }
    }).sort({ score: { $meta: 'textScore' } });
};

// Method to check if pet is adoptable
petSchema.methods.isAdoptable = function() {
    return this.adoption.status === 'available' && 
           this.adoption.availableDate <= new Date();
};

// Method to get adoption stats
petSchema.methods.getAdoptionStats = function() {
    return {
        applications: this.adoption.applications.length,
        pending: this.adoption.applications.filter(app => app.status === 'pending').length,
        approved: this.adoption.applications.filter(app => app.status === 'approved').length,
        daysListed: Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24))
    };
};

module.exports = mongoose.model('Pet', petSchema);