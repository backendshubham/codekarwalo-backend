const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const { isNotAuthenticated } = require('../middleware/auth');

// Login page
router.get('/login', isNotAuthenticated, (req, res) => {
    res.render('admin/login', { error: null });
});

// Login process
router.post('/login', isNotAuthenticated, async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.render('admin/login', { error: 'Invalid credentials' });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.render('admin/login', { error: 'Invalid credentials' });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Set session
        req.session.adminId = admin._id;
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.render('admin/login', { error: 'Something went wrong' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/admin/login');
    });
});

module.exports = router; 