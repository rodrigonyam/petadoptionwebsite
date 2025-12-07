const mongoose = require('mongoose');

const shelterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Shelter name is required'],
        trim: true,
        maxlength: [200, 'Shelter name cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Shelter description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    type: {
        type: String,
        enum: ['shelter', 'rescue', 'sanctuary', 'foster-network', 'municipal'],
        required: true
    },
    contact: {
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
        },
        website: {
            type: String,
            match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
        },
        socialMedia: {
            facebook: String,
            instagram: String,
            twitter: String,
            tiktok: String
        }
    },
    address: {
        street: {
            type: String,
            required: [true, 'Street address is required'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true
        },
        zipCode: {
            type: String,
            required: [true, 'ZIP code is required'],
            trim: true
        },
        country: {
            type: String,
            default: 'USA'
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    hours: {
        monday: { open: String, close: String, closed: { type: Boolean, default: false } },
        tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
        wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
        thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
        friday: { open: String, close: String, closed: { type: Boolean, default: false } },
        saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
        sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
    },
    services: {
        adoption: { type: Boolean, default: true },
        fostering: { type: Boolean, default: false },
        veterinary: { type: Boolean, default: false },
        grooming: { type: Boolean, default: false },
        training: { type: Boolean, default: false },
        boarding: { type: Boolean, default: false },
        spayNeuter: { type: Boolean, default: false },
        emergency: { type: Boolean, default: false }
    },
    capacity: {
        dogs: {
            current: { type: Number, default: 0, min: 0 },
            maximum: { type: Number, default: 50, min: 1 }
        },
        cats: {
            current: { type: Number, default: 0, min: 0 },
            maximum: { type: Number, default: 100, min: 1 }
        },
        other: {
            current: { type: Number, default: 0, min: 0 },
            maximum: { type: Number, default: 20, min: 0 }
        }
    },
    staff: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['director', 'manager', 'veterinarian', 'volunteer-coordinator', 'adoption-counselor', 'caregiver', 'admin'],
            required: true
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    volunteers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        roles: [{
            type: String,
            enum: ['animal-care', 'adoption-events', 'transport', 'fundraising', 'administration', 'photography', 'training', 'maintenance']
        }],
        startDate: {
            type: Date,
            default: Date.now
        },
        totalHours: {
            type: Number,
            default: 0,
            min: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        background: {
            checkCompleted: { type: Boolean, default: false },
            checkDate: Date,
            approved: { type: Boolean, default: false }
        }
    }],
    certifications: [{
        name: {
            type: String,
            required: true
        },
        issuedBy: String,
        issueDate: Date,
        expiryDate: Date,
        certificateNumber: String,
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    policies: {
        adoption: {
            minimumAge: {
                type: Number,
                default: 18,
                min: 16
            },
            homeVisitRequired: {
                type: Boolean,
                default: false
            },
            references: {
                required: { type: Boolean, default: true },
                minimum: { type: Number, default: 2, min: 1 }
            },
            returnPolicy: {
                type: String,
                maxlength: 500
            }
        },
        volunteer: {
            minimumAge: {
                type: Number,
                default: 16,
                min: 14
            },
            backgroundCheck: {
                type: Boolean,
                default: true
            },
            orientationRequired: {
                type: Boolean,
                default: true
            },
            minimumCommitment: String // e.g., "4 hours per month"
        }
    },
    donations: {
        taxId: String, // EIN for tax-deductible donations
        paymentMethods: [{
            type: String,
            enum: ['paypal', 'stripe', 'square', 'venmo', 'cashapp', 'check', 'cash']
        }],
        wishlist: [{
            item: String,
            category: {
                type: String,
                enum: ['food', 'toys', 'medical', 'cleaning', 'office', 'maintenance', 'other']
            },
            priority: {
                type: String,
                enum: ['low', 'medium', 'high', 'urgent'],
                default: 'medium'
            },
            description: String
        }]
    },
    statistics: {
        adoptions: {
            thisYear: { type: Number, default: 0 },
            total: { type: Number, default: 0 }
        },
        intakes: {
            thisYear: { type: Number, default: 0 },
            total: { type: Number, default: 0 }
        },
        volunteers: {
            active: { type: Number, default: 0 },
            total: { type: Number, default: 0 }
        },
        events: {
            thisYear: { type: Number, default: 0 }
        }
    },
    images: [{
        url: String,
        caption: String,
        category: {
            type: String,
            enum: ['exterior', 'interior', 'animals', 'staff', 'events', 'logo']
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending-approval', 'suspended'],
        default: 'pending-approval'
    },
    verified: {
        type: Boolean,
        default: false
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
shelterSchema.index({ 'address.city': 1, 'address.state': 1 });
shelterSchema.index({ type: 1, status: 1 });
shelterSchema.index({ featured: 1, status: 1 });
shelterSchema.index({ verified: 1 });

// Text index for search
shelterSchema.index({
    name: 'text',
    description: 'text'
});

// Virtuals
shelterSchema.virtual('fullAddress').get(function() {
    return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

shelterSchema.virtual('totalCapacity').get(function() {
    return this.capacity.dogs.maximum + this.capacity.cats.maximum + this.capacity.other.maximum;
});

shelterSchema.virtual('currentOccupancy').get(function() {
    return this.capacity.dogs.current + this.capacity.cats.current + this.capacity.other.current;
});

shelterSchema.virtual('occupancyRate').get(function() {
    return this.totalCapacity > 0 ? (this.currentOccupancy / this.totalCapacity * 100) : 0;
});

shelterSchema.virtual('activeVolunteers').get(function() {
    return this.volunteers.filter(v => v.isActive).length;
});

shelterSchema.virtual('activeStaff').get(function() {
    return this.staff.filter(s => s.isActive).length;
});

// Static methods
shelterSchema.statics.findByLocation = function(city, state, radius = 50) {
    return this.find({
        'address.city': new RegExp(city, 'i'),
        'address.state': new RegExp(state, 'i'),
        status: 'active',
        verified: true
    });
};

shelterSchema.statics.findFeatured = function() {
    return this.find({
        featured: true,
        status: 'active',
        verified: true
    });
};

shelterSchema.statics.searchShelters = function(query) {
    return this.find({
        $text: { $search: query },
        status: 'active',
        verified: true
    }, {
        score: { $meta: 'textScore' }
    }).sort({ score: { $meta: 'textScore' } });
};

// Instance methods
shelterSchema.methods.addStaff = function(userId, role) {
    // Remove existing staff entry if exists
    this.staff = this.staff.filter(s => !s.user.equals(userId));
    
    this.staff.push({
        user: userId,
        role: role,
        isActive: true
    });
    
    return this.save();
};

shelterSchema.methods.addVolunteer = function(userId, roles = []) {
    // Check if volunteer already exists
    const existingVolunteer = this.volunteers.find(v => v.user.equals(userId));
    
    if (existingVolunteer) {
        existingVolunteer.roles = [...new Set([...existingVolunteer.roles, ...roles])];
        existingVolunteer.isActive = true;
    } else {
        this.volunteers.push({
            user: userId,
            roles: roles,
            isActive: true
        });
    }
    
    return this.save();
};

shelterSchema.methods.updateCapacity = function(type, current) {
    if (this.capacity[type]) {
        this.capacity[type].current = current;
        return this.save();
    }
    throw new Error('Invalid capacity type');
};

shelterSchema.methods.isWithinCapacity = function(type) {
    return this.capacity[type] && 
           this.capacity[type].current < this.capacity[type].maximum;
};

shelterSchema.methods.getAvailableSpace = function(type = null) {
    if (type && this.capacity[type]) {
        return this.capacity[type].maximum - this.capacity[type].current;
    }
    
    return {
        dogs: this.capacity.dogs.maximum - this.capacity.dogs.current,
        cats: this.capacity.cats.maximum - this.capacity.cats.current,
        other: this.capacity.other.maximum - this.capacity.other.current,
        total: this.totalCapacity - this.currentOccupancy
    };
};

shelterSchema.methods.getOperatingHours = function(day = null) {
    if (day) {
        const dayLower = day.toLowerCase();
        return this.hours[dayLower] || null;
    }
    return this.hours;
};

shelterSchema.methods.isOpen = function(day = null, time = null) {
    const checkDay = day || new Date().toLocaleLowerCase().slice(0, 3);
    const hours = this.getOperatingHours(checkDay);
    
    if (!hours || hours.closed) return false;
    if (!time) return true;
    
    const currentTime = new Date(`1970-01-01T${time}:00`);
    const openTime = new Date(`1970-01-01T${hours.open}:00`);
    const closeTime = new Date(`1970-01-01T${hours.close}:00`);
    
    return currentTime >= openTime && currentTime <= closeTime;
};

module.exports = mongoose.model('Shelter', shelterSchema);