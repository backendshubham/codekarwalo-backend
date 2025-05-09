const Project = require('../models/Project');
const Client = require('../models/Client');
const { validationResult } = require('express-validator');

// Get all projects
const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('client_id', 'name email')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get project by ID
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('client_id', 'name email');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create new project
const createProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const {
            client_id,
            title,
            description,
            category,
            deadline,
            requiredSkills,
            complexity,
            additionalRequirements,
            paymentMethod,
            paymentAmount
        } = req.body;

        // Validate client exists
        const client = await Client.findById(client_id);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const project = new Project({
            client_id,
            title,
            description,
            category,
            deadline,
            requiredSkills,
            complexity,
            additionalRequirements,
            paymentMethod,
            paymentAmount,
            status: 'pending'
        });

        const savedProject = await project.save();
        res.status(201).json({
            success: true,
            data: savedProject
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update project
const updateProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('client_id', 'name email')
         .populate('assignedEngineers', 'name email specialization');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Delete project
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Get projects by client
const getProjectsByClient = async (req, res) => {
    try {
        const projects = await Project.find({ client_id: req.params.clientId })
            .populate('assignedEngineers', 'name email specialization')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Update project status
const updateProjectStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate('client_id', 'name email')
         .populate('assignedEngineers', 'name email specialization');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Assign engineer to project
const assignEngineer = async (req, res) => {
    try {
        const { engineerId } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (!project.assignedEngineers.includes(engineerId)) {
            project.assignedEngineers.push(engineerId);
            await project.save();
        }

        const updatedProject = await Project.findById(req.params.id)
            .populate('client_id', 'name email')
            .populate('assignedEngineers', 'name email specialization');

        res.json({
            success: true,
            data: updatedProject
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Remove engineer from project
const removeEngineer = async (req, res) => {
    try {
        const { engineerId } = req.params;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        project.assignedEngineers = project.assignedEngineers.filter(
            engineer => engineer.toString() !== engineerId
        );
        
        await project.save();

        const updatedProject = await Project.findById(req.params.id)
            .populate('client_id', 'name email')
            .populate('assignedEngineers', 'name email specialization');

        res.json({
            success: true,
            data: updatedProject
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    getAllProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectsByClient,
    updateProjectStatus,
    assignEngineer,
    removeEngineer
}; 