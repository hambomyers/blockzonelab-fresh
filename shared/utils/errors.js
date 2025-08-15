/**
 * Custom Error Classes
 * 
 * Defines custom error classes for the application.
 */

export class ApiError extends Error {
    /**
     * Create a new API error
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Error message
     * @param {boolean} isOperational - Is this a known operational error?
     * @param {string} stack - Optional stack trace
     */
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
        
        // Maintain proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        
        this.name = this.constructor.name;
    }
}

export class ValidationError extends ApiError {
    /**
     * Create a new validation error
     * @param {string} message - Error message
     * @param {Array} errors - Array of validation errors
     */
    constructor(message = 'Validation failed', errors = []) {
        super(400, message, true);
        this.errors = errors;
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends ApiError {
    /**
     * Create a new authentication error
     * @param {string} message - Error message
     */
    constructor(message = 'Not authenticated') {
        super(401, message, true);
        this.name = 'AuthenticationError';
    }
}

export class ForbiddenError extends ApiError {
    /**
     * Create a new forbidden error
     * @param {string} message - Error message
     */
    constructor(message = 'Forbidden') {
        super(403, message, true);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends ApiError {
    /**
     * Create a new not found error
     * @param {string} resource - Name of the resource that wasn't found
     */
    constructor(resource = 'Resource') {
        super(404, `${resource} not found`, true);
        this.name = 'NotFoundError';
    }
}

export class RateLimitError extends ApiError {
    /**
     * Create a new rate limit error
     * @param {string} message - Error message
     */
    constructor(message = 'Too many requests, please try again later') {
        super(429, message, true);
        this.name = 'RateLimitError';
    }
}

export class InternalServerError extends ApiError {
    /**
     * Create a new internal server error
     * @param {string} message - Error message
     * @param {Error} originalError - Original error that caused this
     */
    constructor(message = 'Internal server error', originalError = null) {
        super(500, message, false);
        this.name = 'InternalServerError';
        this.originalError = originalError;
        
        if (originalError) {
            this.stack = originalError.stack;
        }
    }
}

/**
 * Error handler middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
    // Default to 500 (Internal Server Error)
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errors = [];
    let isOperational = err.isOperational !== false; // Default to true if not specified
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        // Handle Mongoose validation errors
        statusCode = 400;
        message = 'Validation Error';
        isOperational = true;
        
        // Extract validation errors
        if (err.errors) {
            errors = Object.values(err.errors).map(error => ({
                field: error.path,
                message: error.message
            }));
        }
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        isOperational = true;
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        isOperational = true;
    } else if (err.name === 'MongoError' && err.code === 11000) {
        // Handle duplicate key error
        statusCode = 400;
        message = 'Duplicate key error';
        isOperational = true;
        
        // Extract the duplicate field from the error message
        const match = err.message.match(/index: (.+?) dup key/);
        if (match && match[1]) {
            const field = match[1].split('_')[0];
            errors.push({
                field,
                message: `${field} already exists`
            });
        }
    }
    
    // Log the error for debugging
    if (!isOperational) {
        console.error('Non-operational error:', {
            message: err.message,
            stack: err.stack,
            name: err.name,
            statusCode: err.statusCode,
            originalError: err.originalError
        });
    }
    
    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production' && !isOperational) {
        message = 'Something went wrong';
    }
    
    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            code: err.name || 'InternalServerError',
            message,
            ...(errors.length > 0 && { errors }),
            ...(process.env.NODE_ENV !== 'production' && {
                stack: err.stack,
                details: err.details
            })
        }
    });
};

/**
 * Async error handler wrapper
 * @param {Function} fn - The async route handler function
 * @returns {Function} Wrapped function with error handling
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create a custom error object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {boolean} isOperational - Is this an operational error?
 * @returns {Error} Custom error object
 */
export const createError = (message, statusCode = 500, isOperational = true) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = isOperational;
    return error;
};
