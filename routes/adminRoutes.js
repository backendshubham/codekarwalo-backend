const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('admin/dashboard', {
        title: 'Dashboard',
        user: req.session.adminId
    });
});

// Engineers list
router.get('/engineers', isAuthenticated, (req, res) => {
    res.render('admin/engineers', {
        title: 'Engineers',
        user: req.session.adminId
    });
});

// Clients list
router.get('/clients', isAuthenticated, (req, res) => {
    res.render('admin/clients', {
        title: 'Clients',
        user: req.session.adminId
    });
});

module.exports = router; 