const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false // Don't include password in queries by default
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true, default: 'USA' }
    },
    role: {
        type: String,
        enum: ['user', 'shelter', 'admin'],
        default: 'user'
    },
    userType: {
        type: String,
        enum: ['adopting', 'volunteering', 'both'],
        default: 'adopting'
    },
    preferences: {
        petTypes: [{
            type: String,
            enum: ['cats', 'dogs', 'rabbits', 'birds', 'other']
        }],
        agePreferences: {
            type: String,
            enum: ['puppy/kitten', 'young', 'adult', 'senior', 'all'],
            default: 'all'
        },
        sizePreferences: [{
            type: String,
            enum: ['small', 'medium', 'large', 'extra-large']
        }],
        newsletter: {
            type: Boolean,
            default: false
        },
        emailNotifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        }
    },
    profile: {
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters']
        },
        experience: {
            type: String,
            maxlength: [1000, 'Experience description cannot exceed 1000 characters']
        },
        housingType: {
            type: String,
            enum: ['apartment', 'house', 'condo', 'farm', 'other']
        },
        hasYard: {
            type: Boolean,
            default: false
        },
        hasPets: {
            type: Boolean,
            default: false
        },
        currentPets: [{
            type: {
                type: String,
                enum: ['cat', 'dog', 'rabbit', 'bird', 'other']
            },
            name: String,
            age: Number,
            breed: String
        }]
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet'
    }],
    adoptionHistory: [{
        pet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pet'
        },
        adoptionDate: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['completed', 'returned', 'failed'],
            default: 'completed'
        }
    }],
    volunteerHours: {
        type: Number,
        default: 0,
        min: [0, 'Volunteer hours cannot be negative']
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get user stats
userSchema.methods.getStats = function() {
    return {
        adoptions: this.adoptionHistory.length,
        favorites: this.favorites.length,
        volunteerHours: this.volunteerHours,
        memberSince: this.createdAt
    };
};

// Static method to find users by location
userSchema.statics.findByLocation = function(city, state) {
    return this.find({
        'address.city': new RegExp(city, 'i'),
        'address.state': new RegExp(state, 'i'),
        isActive: true
    });
};

module.exports = mongoose.model('User', userSchema);