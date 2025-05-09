const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    // Project Information
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            'Software Development',
            'Web Development',
            'Graphic Design',
            'Data Science',
            'UI/UX Design',
            'Embedded Systems',
            'Other'
        ]
    },
    deadline: {
        type: Date,
        required: true
    },
    // Requirements
    requiredSkills: [{
        type: String,
        trim: true
    }],
    complexity: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        required: true
    },
    additionalRequirements: {
        type: String,
        trim: true
    },
    // Payment Information
    paymentMethod: {
        type: String,
        enum: ['Weekly', 'Hourly', 'Monthly', 'By Task'],
        required: true
    },
    paymentAmount: {
        type: Number,
        min: 0
    },
    // Project Status and Assignments
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    assignedEngineers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Engineer'
    }],
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
projectSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to create a new project
projectSchema.statics.createProject = async function(projectData) {
    try {
        const project = new this(projectData);
        await project.save();
        return project;
    } catch (error) {
        throw error;
    }
};

// Static method to get all projects
projectSchema.statics.getAllProjects = async function() {
    try {
        return await this.find()
            .sort({ createdAt: -1 })
            .populate('client', 'name email')
            .populate('assignedEngineers', 'name email skills');
    } catch (error) {
        throw error;
    }
};

// Static method to get project by ID
projectSchema.statics.getProjectById = async function(projectId) {
    try {
        return await this.findById(projectId)
            .populate('client', 'name email')
            .populate('assignedEngineers', 'name email skills');
    } catch (error) {
        throw error;
    }
};

// Static method to update project
projectSchema.statics.updateProject = async function(projectId, updateData) {
    try {
        return await this.findByIdAndUpdate(
            projectId,
            { ...updateData, updatedAt: new Date() },
            { new: true }
        );
    } catch (error) {
        throw error;
    }
};

// Static method to delete project
projectSchema.statics.deleteProject = async function(projectId) {
    try {
        return await this.findByIdAndDelete(projectId);
    } catch (error) {
        throw error;
    }
};

// Static method to get projects by status
projectSchema.statics.getProjectsByStatus = async function(status) {
    try {
        return await this.find({ status })
            .sort({ createdAt: -1 })
            .populate('client', 'name email')
            .populate('assignedEngineers', 'name email skills');
    } catch (error) {
        throw error;
    }
};

// Static method to get projects by client
projectSchema.statics.getProjectsByClient = async function(clientId) {
    try {
        return await this.find({ client: clientId })
            .sort({ createdAt: -1 })
            .populate('assignedEngineers', 'name email skills');
    } catch (error) {
        throw error;
    }
};

// Static method to get projects by assigned engineer
projectSchema.statics.getProjectsByEngineer = async function(engineerId) {
    try {
        return await this.find({ assignedEngineers: engineerId })
            .sort({ createdAt: -1 })
            .populate('client', 'name email');
    } catch (error) {
        throw error;
    }
};

// Check if model exists before creating
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

module.exports = Project; 