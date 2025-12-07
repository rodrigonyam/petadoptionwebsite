const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = {
            message,
            statusCode: 404
        };
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        let message = 'Duplicate field value entered';
        
        // Extract field name from error
        const field = Object.keys(err.keyValue)[0];
        if (field === 'email') {
            message = 'Email address is already registered';
        } else if (field === 'name') {
            message = 'Name is already taken';
        }
        
        error = {
            message,
            statusCode: 400,
            field: field
        };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = {};
        let message = 'Validation error';

        Object.values(err.errors).forEach(val => {
            errors[val.path] = val.message;
        });

        error = {
            message,
            statusCode: 400,
            errors
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = {
            message,
            statusCode: 401
        };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = {
            message,
            statusCode: 401
        };
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File size too large';
        error = {
            message,
            statusCode: 400
        };
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'Unexpected file field';
        error = {
            message,
            statusCode: 400
        };
    }

    // Database connection errors
    if (err.name === 'MongooseError' || err.name === 'MongoError') {
        const message = 'Database connection error';
        error = {
            message,
            statusCode: 500
        };
    }

    // Network timeout errors
    if (err.code === 'ETIMEDOUT') {
        const message = 'Request timeout';
        error = {
            message,
            statusCode: 408
        };
    }

    // Rate limiting errors
    if (err.status === 429) {
        error = {
            message: 'Too many requests. Please try again later.',
            statusCode: 429,
            retryAfter: err.retryAfter || 900 // 15 minutes default
        };
    }

    // Default error response
    const statusCode = error.statusCode || err.statusCode || 500;
    const message = error.message || 'Server Error';

    const response = {
        success: false,
        message: message
    };

    // Add additional error details in development
    if (process.env.NODE_ENV === 'development') {
        response.error = err;
        response.stack = err.stack;
    }

    // Add field-specific errors if available
    if (error.errors) {
        response.errors = error.errors;
    }

    // Add field name for duplicate errors
    if (error.field) {
        response.field = error.field;
    }

    // Add retry after for rate limiting
    if (error.retryAfter) {
        response.retryAfter = error.retryAfter;
        res.set('Retry-After', error.retryAfter);
    }

    res.status(statusCode).json(response);
};

module.exports = { errorHandler };