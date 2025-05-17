const { HTTP_STATUS } = require('../config/constants');

/**
 * Standard response handler for API responses
 */
const responseHandler = {
    /**
     * Success response
     * @param {Object} res - Express response object
     * @param {Object} data - Response data
     * @param {String} message - Success message
     * @param {Number} statusCode - HTTP status code
     */
    success: (res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) => {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    },

    /**
     * Error response
     * @param {Object} res - Express response object
     * @param {String} message - Error message
     * @param {Number} statusCode - HTTP status code
     * @param {Object} error - Error object (optional)
     */
    error: (res, message = 'Error', statusCode = HTTP_STATUS.SERVER_ERROR, error = null) => {
        const response = {
            success: false,
            message
        };

        if (error && process.env.NODE_ENV === 'development') {
            response.error = error;
        }

        return res.status(statusCode).json(response);
    },

    /**
     * Validation error response
     * @param {Object} res - Express response object
     * @param {String} message - Validation error message
     * @param {Object} errors - Validation errors (optional)
     */
    validationError: (res, message = 'Validation Error', errors = null) => {
        const response = {
            success: false,
            message
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(HTTP_STATUS.BAD_REQUEST).json(response);
    },

    /**
     * Not found response
     * @param {Object} res - Express response object
     * @param {String} message - Not found message
     */
    notFound: (res, message = 'Not Found') => {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message
        });
    }
};

module.exports = responseHandler; 