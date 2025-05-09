const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Session-based authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return next();
    }
    res.redirect('/admin/login');
};

// JWT-based authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get admin from database
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }

        // Check if admin is active
        if (admin.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive.'
            });
        }

        // Add admin to request object
        req.admin = admin;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

// Role-based authorization middleware
const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated.'
            });
        }

        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this resource.'
            });
        }

        next();
    };
};

// Prevent authenticated users from accessing login page
const isNotAuthenticated = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return res.redirect('/admin/dashboard');
    }
    next();
};

module.exports = {
    isAuthenticated,
    authenticateToken,
    authorizeRole,
    isNotAuthenticated
}; 