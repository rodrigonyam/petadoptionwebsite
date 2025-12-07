const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Activity title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Activity description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
        type: String,
        required: [true, 'Activity category is required'],
        enum: ['adoption-event', 'volunteer', 'education', 'fundraising', 'social', 'training'],
        lowercase: true
    },
    type: {
        type: String,
        enum: ['in-person', 'virtual', 'hybrid'],
        default: 'in-person'
    },
    date: {
        start: {
            type: Date,
            required: [true, 'Start date is required']
        },
        end: {
            type: Date,
            required: [true, 'End date is required']
        }
    },
    time: {
        start: {
            type: String,
            required: [true, 'Start time is required'],
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
        },
        end: {
            type: String,
            required: [true, 'End time is required'],
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
        }
    },
    location: {
        name: {
            type: String,
            required: [true, 'Location name is required'],
            trim: true
        },
        address: {
            street: String,
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
            zipCode: String,
            country: {
                type: String,
                default: 'USA'
            }
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        },
        virtualLink: String, // For virtual events
        instructions: String // Special location instructions
    },
    capacity: {
        max: {
            type: Number,
            required: [true, 'Maximum capacity is required'],
            min: [1, 'Capacity must be at least 1']
        },
        current: {
            type: Number,
            default: 0,
            min: [0, 'Current registrations cannot be negative']
        },
        waitlist: {
            type: Number,
            default: 0,
            min: [0, 'Waitlist count cannot be negative']
        }
    },
    registration: {
        required: {
            type: Boolean,
            default: true
        },
        deadline: Date,
        fee: {
            type: Number,
            default: 0,
            min: [0, 'Registration fee cannot be negative']
        },
        requirements: [{
            type: String,
            enum: ['age-restriction', 'waiver', 'experience', 'background-check', 'vaccination'],
            description: String
        }]
    },
    organizer: {
        shelter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shelter',
            required: true
        },
        contact: {
            name: String,
            email: String,
            phone: String
        }
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        registeredAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['registered', 'attended', 'no-show', 'cancelled', 'waitlisted'],
            default: 'registered'
        },
        notes: String,
        checkInTime: Date
    }],
    volunteers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['coordinator', 'assistant', 'photographer', 'greeter', 'cleanup', 'other']
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        hours: Number
    }],
    resources: {
        materials: [{
            item: String,
            quantity: Number,
            provided: Boolean,
            cost: Number
        }],
        equipment: [{
            item: String,
            quantity: Number,
            source: String // 'shelter', 'rental', 'donated'
        }]
    },
    images: [{
        url: String,
        caption: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed', 'postponed'],
        default: 'draft'
    },
    featured: {
        type: Boolean,
        default: false
    },
    recurring: {
        isRecurring: {
            type: Boolean,
            default: false
        },
        pattern: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly']
        },
        endDate: Date,
        exceptions: [Date] // Dates when recurring event is cancelled
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    feedback: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        submittedAt: {
            type: Date,
            default: Date.now
        }
    }],
    stats: {
        views: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
activitySchema.index({ 'date.start': 1, status: 1 });
activitySchema.index({ category: 1, status: 1 });
activitySchema.index({ 'location.address.city': 1, 'location.address.state': 1 });
activitySchema.index({ featured: 1, status: 1 });
activitySchema.index({ organizer: 1 });
activitySchema.index({ createdAt: -1 });

// Text index for search
activitySchema.index({
    title: 'text',
    description: 'text',
    tags: 'text'
});

// Virtuals
activitySchema.virtual('spotsAvailable').get(function() {
    return Math.max(0, this.capacity.max - this.capacity.current);
});

activitySchema.virtual('isFullyBooked').get(function() {
    return this.capacity.current >= this.capacity.max;
});

activitySchema.virtual('registrationOpen').get(function() {
    const now = new Date();
    const deadlinePassed = this.registration.deadline && now > this.registration.deadline;
    const eventStarted = now > this.date.start;
    
    return this.registration.required && 
           !deadlinePassed && 
           !eventStarted && 
           this.status === 'published' &&
           !this.isFullyBooked;
});

activitySchema.virtual('duration').get(function() {
    return this.date.end - this.date.start; // in milliseconds
});

// Pre-save middleware
activitySchema.pre('save', function(next) {
    // Validate end date is after start date
    if (this.date.end <= this.date.start) {
        return next(new Error('End date must be after start date'));
    }
    
    // Validate capacity
    if (this.capacity.current > this.capacity.max) {
        return next(new Error('Current registrations cannot exceed maximum capacity'));
    }
    
    // Set registration deadline if not provided
    if (this.registration.required && !this.registration.deadline) {
        this.registration.deadline = new Date(this.date.start.getTime() - 24 * 60 * 60 * 1000); // 1 day before
    }
    
    next();
});

// Static methods
activitySchema.statics.findUpcoming = function(limit = 10) {
    const now = new Date();
    return this.find({
        'date.start': { $gte: now },
        status: 'published'
    }).sort({ 'date.start': 1 }).limit(limit);
};

activitySchema.statics.findByCategory = function(category) {
    return this.find({
        category: category.toLowerCase(),
        status: 'published'
    }).sort({ 'date.start': 1 });
};

activitySchema.statics.findByLocation = function(city, state) {
    return this.find({
        'location.address.city': new RegExp(city, 'i'),
        'location.address.state': new RegExp(state, 'i'),
        status: 'published'
    });
};

activitySchema.statics.searchActivities = function(query) {
    return this.find({
        $text: { $search: query },
        status: 'published'
    }, {
        score: { $meta: 'textScore' }
    }).sort({ score: { $meta: 'textScore' } });
};

// Instance methods
activitySchema.methods.addParticipant = function(userId, status = 'registered') {
    if (this.capacity.current >= this.capacity.max && status === 'registered') {
        status = 'waitlisted';
        this.capacity.waitlist += 1;
    } else if (status === 'registered') {
        this.capacity.current += 1;
    }
    
    this.participants.push({
        user: userId,
        status: status
    });
    
    return this.save();
};

activitySchema.methods.removeParticipant = function(userId) {
    const participant = this.participants.find(p => p.user.equals(userId));
    if (!participant) return false;
    
    if (participant.status === 'registered') {
        this.capacity.current -= 1;
        
        // Move someone from waitlist if available
        const waitlisted = this.participants.find(p => p.status === 'waitlisted');
        if (waitlisted) {
            waitlisted.status = 'registered';
            this.capacity.current += 1;
            this.capacity.waitlist -= 1;
        }
    } else if (participant.status === 'waitlisted') {
        this.capacity.waitlist -= 1;
    }
    
    this.participants.pull({ user: userId });
    return this.save();
};

activitySchema.methods.getParticipantStats = function() {
    return {
        registered: this.participants.filter(p => p.status === 'registered').length,
        attended: this.participants.filter(p => p.status === 'attended').length,
        noShows: this.participants.filter(p => p.status === 'no-show').length,
        cancelled: this.participants.filter(p => p.status === 'cancelled').length,
        waitlisted: this.participants.filter(p => p.status === 'waitlisted').length
    };
};

module.exports = mongoose.model('Activity', activitySchema);