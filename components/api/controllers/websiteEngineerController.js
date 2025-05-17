const Engineer = require('../models/Engineer');
const { uploadToS3 } = require('../../../config/s3');
const { MESSAGES, HTTP_STATUS } = require('../../../config/constants');
const responseHandler = require('../../../utils/responseHandler');
const bcrypt = require('bcryptjs');

// Website-side engineer registration
async function registerEngineer(req, res) {
    try {
        const {
            name,
            email,
            password,
            bio,
            skills,
            designation,
            specialization,
            experience,
            status,
            contact,
            socialLinks,
            termsAccepted
        } = req.body;

        // Validate required fields
        if (!name || !email || !password || !bio || !skills || !designation || !termsAccepted) {
            return responseHandler.validationError(res, MESSAGES.ENGINEER.REQUIRED_FIELDS);
        }

        // Check if email already exists
        const existingEngineer = await Engineer.findOne({ email });
        if (existingEngineer) {
            return responseHandler.validationError(res, 'Email address is already registered');
        }

        // Validate resume file
        if (!req.files || !req.files.resume) {
            return responseHandler.validationError(res, MESSAGES.ENGINEER.RESUME_REQUIRED);
        }
        const resumeFile = req.files.resume;
        if (resumeFile.mimetype !== 'application/pdf') {
            return responseHandler.validationError(res, MESSAGES.ENGINEER.RESUME_FORMAT);
        }

        // Upload resume to S3
        const resumeUrl = await uploadToS3(resumeFile, 'resumes', name.replace(/\s+/g, '_'));

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create engineer object with all fields
        const engineer = new Engineer({
            name,
            email,
            password: hashedPassword,
            bio,
            skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
            designation,
            specialization,
            experience: experience ? Number(experience) : undefined,
            status: status || 'active',
            resume: resumeUrl,
            contact: contact ? {
                phone: contact.phone,
                address: contact.address,
                city: contact.city,
                state: contact.state,
                country: contact.country,
                zipCode: contact.zipCode
            } : undefined,
            socialLinks: socialLinks ? {
                github: socialLinks.github,
                linkedin: socialLinks.linkedin
            } : undefined,
            termsAccepted: termsAccepted === 'true' || termsAccepted === true
        });

        await engineer.save();
        
        return responseHandler.success(
            res,
            engineer.getPublicProfile(),
            MESSAGES.ENGINEER.REGISTRATION_SUCCESS,
            HTTP_STATUS.CREATED
        );
    } catch (error) {
        console.error('Registration Error:', error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return responseHandler.validationError(res, 'Email address is already registered');
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return responseHandler.validationError(res, messages.join(', '));
        }

        return responseHandler.error(res, MESSAGES.ENGINEER.SERVER_ERROR, HTTP_STATUS.SERVER_ERROR, error);
    }
}

module.exports = {
    registerEngineer
}; 