const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token (exclude password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (!req.user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expired'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized to access this route'
                });
            }
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route, no token provided'
        });
    }
};

// Optional authentication - don't require token but set user if provided
const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Don't throw error, just continue without user
            req.user = null;
        }
    }

    next();
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Check if user owns the resource or is admin/shelter staff
const authorizeOwnerOrStaff = (resourceField = 'user') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authorized to access this route'
                });
            }

            // Admin can access everything
            if (req.user.role === 'admin') {
                return next();
            }

            // For shelter staff, check if they have access to the shelter's resources
            if (req.user.role === 'shelter') {
                // This would need to be customized based on the specific resource
                // For now, allow shelter users to access their own resources
                return next();
            }

            // Check if user owns the resource
            const resourceUserId = req.params.userId || req.body[resourceField] || req.user.id;
            
            if (req.user.id !== resourceUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this resource'
                });
            }

            next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during authorization'
            });
        }
    };
};

// Check if user can manage shelter resources
const authorizeShelterAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        // Admin can access all shelters
        if (req.user.role === 'admin') {
            return next();
        }

        // Shelter users can only access their own shelter
        if (req.user.role === 'shelter') {
            const shelterId = req.params.shelterId || req.body.shelter || req.params.id;
            
            // Find shelter where user is staff
            const Shelter = require('../models/Shelter');
            const shelter = await Shelter.findOne({
                _id: shelterId,
                'staff.user': req.user.id,
                'staff.isActive': true
            });

            if (!shelter) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this shelter'
                });
            }

            req.shelter = shelter;
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions'
        });
    } catch (error) {
        console.error('Shelter authorization error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authorization'
        });
    }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
    const attempts = new Map();

    return (req, res, next) => {
        const key = req.ip + (req.user ? req.user.id : '');
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old attempts
        if (attempts.has(key)) {
            const userAttempts = attempts.get(key).filter(time => time > windowStart);
            attempts.set(key, userAttempts);
        }

        const currentAttempts = attempts.get(key) || [];

        if (currentAttempts.length >= maxAttempts) {
            return res.status(429).json({
                success: false,
                message: 'Too many attempts. Please try again later.',
                retryAfter: Math.ceil((currentAttempts[0] + windowMs - now) / 1000)
            });
        }

        // Add current attempt
        currentAttempts.push(now);
        attempts.set(key, currentAttempts);

        next();
    };
};

// Middleware to log user activity
const logUserActivity = (activity) => {
    return (req, res, next) => {
        if (req.user) {
            // In a real application, you might want to log this to a database
            console.log(`User ${req.user.id} performed: ${activity} at ${new Date().toISOString()}`);
            
            // Update user's last activity
            req.user.lastLogin = new Date();
            req.user.save().catch(console.error);
        }
        next();
    };
};

module.exports = {
    protect,
    optionalAuth,
    authorize,
    authorizeOwnerOrStaff,
    authorizeShelterAccess,
    sensitiveOperationLimit,
    logUserActivity
};