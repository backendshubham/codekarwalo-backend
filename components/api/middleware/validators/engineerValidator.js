const { body } = require('express-validator');

const validateEngineer = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),

    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),

    body('specialization')
        .trim()
        .notEmpty()
        .withMessage('Specialization is required')
        .isIn(['frontend', 'backend', 'fullstack', 'mobile'])
        .withMessage('Invalid specialization'),

    body('skills')
        .optional()
        .isArray()
        .withMessage('Skills must be an array'),

    body('experience')
        .optional()
        .isNumeric()
        .withMessage('Experience must be a number'),

    body('status')
        .optional()
        .isIn(['active', 'inactive', 'on_leave'])
        .withMessage('Invalid status'),

    body('contact.phone')
        .optional()
        .trim()
        .matches(/^[0-9+\-\s()]*$/)
        .withMessage('Invalid phone number'),

    body('contact.address')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Address must not exceed 200 characters'),

    body('socialLinks.github')
        .optional()
        .trim()
        .isURL()
        .withMessage('Invalid GitHub URL'),

    body('socialLinks.linkedin')
        .optional()
        .trim()
        .isURL()
        .withMessage('Invalid LinkedIn URL'),

    body('socialLinks.twitter')
        .optional()
        .trim()
        .isURL()
        .withMessage('Invalid Twitter URL'),

    body('socialLinks.portfolio')
        .optional()
        .trim()
        .isURL()
        .withMessage('Invalid portfolio URL')
];

module.exports = {
    validateEngineer
}; 