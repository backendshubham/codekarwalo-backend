const Engineer = require('../models/Engineer');
const { validationResult } = require('express-validator');

// Get all engineers
async function getAllEngineers(req, res) {
    try {
        const { status, designation, specialization, minExperience, maxExperience, search } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (designation) filter.designation = designation;
        if (specialization) filter.specialization = specialization;
        if (minExperience) filter.experience = { ...filter.experience, $gte: Number(minExperience) };
        if (maxExperience) filter.experience = { ...filter.experience, $lte: Number(maxExperience) };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const engineers = await Engineer.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: engineers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

// Get single engineer
async function getEngineer(req, res) {
    try {
        const engineer = await Engineer.findById(req.params.id)
            .select('-password');

        if (!engineer) {
            return res.status(404).json({
                success: false,
                message: 'Engineer not found'
            });
        }

        res.json({
            success: true,
            data: engineer
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

// Create engineer
async function createEngineer(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const engineer = new Engineer(req.body);
        await engineer.save();

        res.status(201).json({
            success: true,
            data: engineer
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

// Update engineer
async function updateEngineer(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const engineer = await Engineer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        if (!engineer) {
            return res.status(404).json({
                success: false,
                message: 'Engineer not found'
            });
        }

        res.json({
            success: true,
            data: engineer
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

// Delete engineer
async function deleteEngineer(req, res) {
    try {
        const engineer = await Engineer.findByIdAndDelete(req.params.id);

        if (!engineer) {
            return res.status(404).json({
                success: false,
                message: 'Engineer not found'
            });
        }

        res.json({
            success: true,
            message: 'Engineer deleted successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

module.exports = {
    getAllEngineers,
    getEngineer,
    createEngineer,
    updateEngineer,
    deleteEngineer
}; 