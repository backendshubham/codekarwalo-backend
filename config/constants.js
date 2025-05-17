const MESSAGES = {
    // Engineer Registration Messages
    ENGINEER: {
        REQUIRED_FIELDS: 'All required fields must be filled.',
        RESUME_REQUIRED: 'Resume file is required.',
        RESUME_FORMAT: 'Resume must be a PDF file.',
        REGISTRATION_SUCCESS: 'Engineer registered successfully.',
        SERVER_ERROR: 'Server Error'
    },
    // Client Messages
    CLIENT: {
        REQUIRED_FIELDS: 'Name, email, and password are required.',
        EMAIL_EXISTS: 'Email already registered.',
        REGISTRATION_SUCCESS: 'Registration successful.',
        LOGIN_REQUIRED: 'Email and password are required.',
        INVALID_CREDENTIALS: 'Invalid credentials.',
        LOGIN_SUCCESS: 'Login successful.',
        NOT_FOUND: 'Client not found.',
        PROJECT_REQUIRED_FIELDS: 'All required fields must be filled.',
        PROJECT_CREATED: 'Project created successfully.'
    },
    // Common Messages
    COMMON: {
        SUCCESS: 'Success',
        ERROR: 'Error',
        NOT_FOUND: 'Not Found',
        UNAUTHORIZED: 'Unauthorized',
        FORBIDDEN: 'Forbidden',
        VALIDATION_ERROR: 'Validation Error'
    }
};

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
};

module.exports = {
    MESSAGES,
    HTTP_STATUS
}; 