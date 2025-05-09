const Client = require('../models/Client');
const { validationResult } = require('express-validator');

// Get all clients with filters
const getAllClients = async (req, res) => {
    try {
        const { status, search } = req.query;
        const filter = {};

        // Status filter
        if (status) {
            filter.status = status.toLowerCase();
        }

        // Search filter
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }


        const clients = await Client.find(filter)
            .select('-projects')
            .sort({ createdAt: -1 });
                
        res.json({
            success: true,
            data: clients
        });
    } catch (error) {
        console.error('Error in getAllClients:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Get single client
const getClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id)
            .populate('projects.assignedEngineers', 'name email specialization');

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        res.json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Error in getClient:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Create client
const createClient = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { name, email, phone } = req.body;
        const client = new Client({
            name,
            email,
            phone,
            status: 'active' // Set default status
        });
        await client.save();

        res.status(201).json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Error in createClient:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Update client
const updateClient = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { name, email, phone } = req.body;
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            { name, email, phone },
            { new: true, runValidators: true }
        );

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        res.json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Error in updateClient:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Delete client
const deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        res.json({
            success: true,
            message: 'Client deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteClient:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Set client status to active
const setActive = async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            { status: 'active' },
            { new: true }
        );

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        res.json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Error in setActive:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Set client status to inactive
const setInactive = async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(
            req.params.id,
            { status: 'inactive' },
            { new: true }
        );

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        res.json({
            success: true,
            data: client
        });
    } catch (error) {
        console.error('Error in setInactive:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// Add project to client
const addProject = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        client.projects.push(req.body);
        await client.save();

        res.status(201).json({
            success: true,
            data: client
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
        const { clientId, projectId } = req.params;
        const { status } = req.body;

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const project = client.projects.id(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        project.status = status;
        await client.save();

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
        const { clientId, projectId } = req.params;
        const { engineerId } = req.body;

        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        const project = client.projects.id(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        if (!project.assignedEngineers.includes(engineerId)) {
            project.assignedEngineers.push(engineerId);
            await client.save();
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

module.exports = {
    getAllClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    setActive,
    setInactive,
    addProject,
    updateProjectStatus,
    assignEngineer
}; 