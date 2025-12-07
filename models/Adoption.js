const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
    application: {
        id: {
            type: String,
            unique: true,
            required: true
        },
        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        pet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pet',
            required: true
        },
        shelter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shelter',
            required: true
        }
    },
    status: {
        type: String,
        enum: [
            'submitted',
            'under-review',
            'approved',
            'rejected',
            'on-hold',
            'meet-scheduled',
            'meet-completed',
            'home-visit-scheduled',
            'home-visit-completed',
            'adoption-approved',
            'adoption-completed',
            'adoption-returned',
            'withdrawn'
        ],
        default: 'submitted'
    },
    personalInfo: {
        motivation: {
            type: String,
            required: [true, 'Please explain why you want to adopt this pet'],
            maxlength: [1000, 'Motivation cannot exceed 1000 characters']
        },
        experience: {
            previousPets: [{
                type: String,
                name: String,
                yearsOwned: Number,
                currentStatus: {
                    type: String,
                    enum: ['current', 'deceased', 'rehomed', 'lost']
                }
            }],
            experienceLevel: {
                type: String,
                enum: ['none', 'some', 'experienced', 'expert'],
                required: true
            },
            trainingExperience: String
        },
        lifestyle: {
            workSchedule: {
                type: String,
                enum: ['full-time', 'part-time', 'remote', 'retired', 'student', 'unemployed'],
                required: true
            },
            hoursAway: {
                type: Number,
                min: [0, 'Hours away cannot be negative'],
                max: [24, 'Hours away cannot exceed 24']
            },
            activityLevel: {
                type: String,
                enum: ['low', 'moderate', 'high', 'very-high'],
                required: true
            },
            travelFrequency: {
                type: String,
                enum: ['never', 'rarely', 'monthly', 'weekly']
            }
        }
    },
    housingInfo: {
        type: {
            type: String,
            enum: ['apartment', 'house', 'condo', 'townhouse', 'farm', 'mobile-home'],
            required: [true, 'Housing type is required']
        },
        ownership: {
            type: String,
            enum: ['own', 'rent', 'family', 'other'],
            required: [true, 'Ownership status is required']
        },
        landlordApproval: {
            hasApproval: Boolean,
            landlordContact: {
                name: String,
                phone: String,
                email: String
            }
        },
        yard: {
            hasYard: {
                type: Boolean,
                required: true
            },
            fenced: Boolean,
            fenceHeight: Number,
            size: {
                type: String,
                enum: ['none', 'small', 'medium', 'large', 'acreage']
            }
        },
        currentPets: [{
            type: String,
            name: String,
            age: Number,
            spayedNeutered: Boolean,
            vaccinated: Boolean,
            temperament: String
        }],
        petRestrictions: String,
        emergencyPlan: String
    },
    references: [{
        type: {
            type: String,
            enum: ['personal', 'veterinary', 'professional', 'landlord'],
            required: true
        },
        name: {
            type: String,
            required: true
        },
        relationship: String,
        contact: {
            phone: {
                type: String,
                required: true
            },
            email: String
        },
        contacted: {
            type: Boolean,
            default: false
        },
        contactedAt: Date,
        response: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comments: String,
            recommend: Boolean
        }
    }],
    visits: [{
        type: {
            type: String,
            enum: ['meet-and-greet', 'home-visit', 'follow-up'],
            required: true
        },
        scheduledDate: {
            type: Date,
            required: true
        },
        duration: Number, // in minutes
        location: String,
        attendees: [{
            name: String,
            role: String
        }],
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled', 'no-show', 'rescheduled'],
            default: 'scheduled'
        },
        notes: String,
        outcome: {
            type: String,
            enum: ['approved', 'rejected', 'needs-follow-up', 'pending']
        },
        completedAt: Date
    }],
    timeline: [{
        status: String,
        date: {
            type: Date,
            default: Date.now
        },
        notes: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    fees: {
        adoption: {
            type: Number,
            required: true
        },
        additional: [{
            description: String,
            amount: Number
        }],
        total: Number,
        paid: {
            type: Number,
            default: 0
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'partial', 'paid', 'refunded'],
            default: 'pending'
        },
        paymentMethod: String,
        transactionId: String
    },
    documents: [{
        type: {
            type: String,
            enum: ['application', 'contract', 'receipt', 'medical-records', 'return-agreement', 'other']
        },
        filename: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    contract: {
        signed: {
            type: Boolean,
            default: false
        },
        signedAt: Date,
        terms: {
            returnPolicy: String,
            medicalCare: String,
            spayNeuterAgreement: String,
            contactAgreement: String
        },
        signatures: {
            adopter: {
                signed: Boolean,
                signedAt: Date,
                ipAddress: String
            },
            witness: {
                name: String,
                signed: Boolean,
                signedAt: Date
            }
        }
    },
    followUp: [{
        scheduledDate: Date,
        type: {
            type: String,
            enum: ['call', 'email', 'visit', 'survey']
        },
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: Date,
        notes: String,
        outcome: {
            type: String,
            enum: ['successful', 'needs-support', 'concerning', 'returned']
        }
    }],
    returnInfo: {
        returned: {
            type: Boolean,
            default: false
        },
        returnDate: Date,
        reason: {
            type: String,
            enum: [
                'behavioral-issues',
                'allergies',
                'housing-change',
                'financial-hardship',
                'family-change',
                'health-issues',
                'not-good-fit',
                'other'
            ]
        },
        details: String,
        petCondition: String
    },
    internalNotes: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        isPrivate: {
            type: Boolean,
            default: true
        }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
adoptionSchema.index({ 'application.id': 1 });
adoptionSchema.index({ 'application.applicant': 1 });
adoptionSchema.index({ 'application.pet': 1 });
adoptionSchema.index({ 'application.shelter': 1 });
adoptionSchema.index({ status: 1 });
adoptionSchema.index({ createdAt: -1 });

// Pre-save middleware
adoptionSchema.pre('save', function(next) {
    // Generate application ID if not exists
    if (!this.application.id) {
        this.application.id = `APP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
    
    // Calculate total fees
    this.fees.total = this.fees.adoption + 
        this.fees.additional.reduce((sum, fee) => sum + fee.amount, 0);
    
    // Update payment status
    if (this.fees.paid >= this.fees.total) {
        this.fees.paymentStatus = 'paid';
    } else if (this.fees.paid > 0) {
        this.fees.paymentStatus = 'partial';
    }
    
    // Add timeline entry for status changes
    if (this.isModified('status')) {
        this.timeline.push({
            status: this.status,
            date: new Date()
        });
    }
    
    next();
});

// Virtuals
adoptionSchema.virtual('daysInProcess').get(function() {
    return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

adoptionSchema.virtual('outstandingBalance').get(function() {
    return Math.max(0, this.fees.total - this.fees.paid);
});

adoptionSchema.virtual('isCompleted').get(function() {
    return this.status === 'adoption-completed';
});

adoptionSchema.virtual('isActive').get(function() {
    const activeStatuses = [
        'submitted', 'under-review', 'approved', 'meet-scheduled',
        'meet-completed', 'home-visit-scheduled', 'home-visit-completed',
        'adoption-approved'
    ];
    return activeStatuses.includes(this.status);
});

// Static methods
adoptionSchema.statics.findByStatus = function(status) {
    return this.find({ status }).populate('application.applicant application.pet application.shelter');
};

adoptionSchema.statics.findByApplicant = function(userId) {
    return this.find({ 'application.applicant': userId })
        .populate('application.pet application.shelter')
        .sort({ createdAt: -1 });
};

adoptionSchema.statics.findByShelter = function(shelterId) {
    return this.find({ 'application.shelter': shelterId })
        .populate('application.applicant application.pet')
        .sort({ createdAt: -1 });
};

adoptionSchema.statics.getStatistics = function(shelterId = null) {
    const pipeline = [
        ...(shelterId ? [{ $match: { 'application.shelter': mongoose.Types.ObjectId(shelterId) } }] : []),
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgProcessingTime: {
                    $avg: {
                        $divide: [
                            { $subtract: ['$updatedAt', '$createdAt'] },
                            1000 * 60 * 60 * 24 // Convert to days
                        ]
                    }
                }
            }
        }
    ];
    
    return this.aggregate(pipeline);
};

// Instance methods
adoptionSchema.methods.updateStatus = function(newStatus, notes = '', updatedBy = null) {
    this.status = newStatus;
    this.timeline.push({
        status: newStatus,
        notes: notes,
        updatedBy: updatedBy
    });
    
    return this.save();
};

adoptionSchema.methods.scheduleVisit = function(visitData) {
    this.visits.push({
        ...visitData,
        status: 'scheduled'
    });
    
    return this.save();
};

adoptionSchema.methods.completeVisit = function(visitId, outcome, notes) {
    const visit = this.visits.id(visitId);
    if (visit) {
        visit.status = 'completed';
        visit.outcome = outcome;
        visit.notes = notes;
        visit.completedAt = new Date();
        
        // Update adoption status based on visit outcome
        if (visit.type === 'meet-and-greet' && outcome === 'approved') {
            this.status = 'meet-completed';
        } else if (visit.type === 'home-visit' && outcome === 'approved') {
            this.status = 'home-visit-completed';
        }
        
        return this.save();
    }
    
    throw new Error('Visit not found');
};

adoptionSchema.methods.addNote = function(content, author, isPrivate = true) {
    this.internalNotes.push({
        author: author,
        content: content,
        isPrivate: isPrivate
    });
    
    return this.save();
};

adoptionSchema.methods.processPayment = function(amount, method, transactionId) {
    this.fees.paid += amount;
    this.fees.paymentMethod = method;
    this.fees.transactionId = transactionId;
    
    // Update payment status
    if (this.fees.paid >= this.fees.total) {
        this.fees.paymentStatus = 'paid';
        if (this.status === 'adoption-approved') {
            this.status = 'adoption-completed';
        }
    } else {
        this.fees.paymentStatus = 'partial';
    }
    
    return this.save();
};

adoptionSchema.methods.getNextSteps = function() {
    const steps = {
        'submitted': ['Review application', 'Contact references', 'Schedule meet & greet'],
        'under-review': ['Complete reference checks', 'Schedule meet & greet'],
        'approved': ['Schedule meet & greet'],
        'meet-scheduled': ['Complete meet & greet'],
        'meet-completed': ['Schedule home visit (if required)', 'Finalize adoption'],
        'home-visit-scheduled': ['Complete home visit'],
        'home-visit-completed': ['Approve adoption', 'Process payment'],
        'adoption-approved': ['Process payment', 'Sign contract', 'Schedule pickup'],
        'adoption-completed': ['Follow-up calls', 'Support as needed']
    };
    
    return steps[this.status] || [];
};

module.exports = mongoose.model('Adoption', adoptionSchema);