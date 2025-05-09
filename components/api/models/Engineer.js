const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const engineerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    bio: {
        type: String,
        required: [true, 'Bio is required'],
        trim: true
    },
    skills: [{
        type: String,
        trim: true
    }],
    designation: {
        type: String,
        required: [true, 'Designation is required'],
        enum: ['Student', 'Employee']
    },
    specialization: {
        type: String,
        required: [true, 'Specialization is required'],
        enum: ['frontend', 'backend', 'fullstack', 'mobile']
    },
    experience: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'on_leave'],
        default: 'active'
    },
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    resume: {
        type: String,
        required: [true, 'Resume is required']
    },
    profileImage: {
        type: String,
        default: 'default-profile.jpg'
    },
    contact: {
        phone: String,
        address: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    socialLinks: {
        github: String,
        linkedin: String,
        twitter: String,
        portfolio: String
    },
    lastLogin: {
        type: Date,
        default: null
    },
    termsAccepted: {
        type: Boolean,
        required: [true, 'Terms acceptance is required'],
        default: false
    },
    termsAcceptedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Hash password before saving
engineerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
engineerSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
engineerSchema.methods.getPublicProfile = function() {
    const engineerObject = this.toObject();
    delete engineerObject.password;
    return engineerObject;
};

const Engineer = mongoose.model('engineers', engineerSchema);

module.exports = Engineer; 