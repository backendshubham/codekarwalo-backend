const { body } = require('express-validator');

const validateClient = [
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

    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9+\-\s()]*$/)
        .withMessage('Invalid phone number')
];

const validateProject = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Project title is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Project title must be between 3 and 100 characters'),

    body('description')
        .trim()
        .notEmpty()
        .withMessage('Project description is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Project description must be between 10 and 1000 characters'),

    body('category')
        .trim()
        .notEmpty()
        .withMessage('Project category is required')
        .isIn([
            'Software Development',
            'Web Development',
            'Graphic Design',
            'Data Science',
            'UI/UX Design',
            'Embedded Systems',
            'Other'
        ])
        .withMessage('Invalid project category'),

    body('deadline')
        .notEmpty()
        .withMessage('Project deadline is required')
        .isISO8601()
        .withMessage('Invalid deadline date')
        .custom((value) => {
            const deadline = new Date(value);
            const now = new Date();
            if (deadline <= now) {
                throw new Error('Deadline must be in the future');
            }
            return true;
        }),

    body('requiredSkills')
        .isArray()
        .withMessage('Required skills must be an array')
        .notEmpty()
        .withMessage('At least one skill is required'),

    body('requiredSkills.*')
        .isIn([
            'Frontend Development',
            'Backend Development',
            'UI/UX Design',
            'Data Analysis',
            'Mobile Development',
            'DevOps',
            'Other'
        ])
        .withMessage('Invalid skill'),

    body('complexity')
        .trim()
        .notEmpty()
        .withMessage('Project complexity is required')
        .isIn(['Low', 'Medium', 'High'])
        .withMessage('Invalid complexity level'),

    body('additionalRequirements')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Additional requirements must not exceed 500 characters'),

    body('paymentMethod')
        .trim()
        .notEmpty()
        .withMessage('Payment method is required')
        .isIn(['Weekly', 'Hourly', 'Monthly', 'By Task'])
        .withMessage('Invalid payment method'),

    body('paymentAmount')
        .optional()
        .isNumeric()
        .withMessage('Payment amount must be a number')
        .custom((value) => {
            if (value < 0) {
                throw new Error('Payment amount cannot be negative');
            }
            return true;
        })
];

module.exports = {
    validateClient,
    validateProject
}; 