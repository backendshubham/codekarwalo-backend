const express = require('express');
const router = express.Router();

// Import route modules
const adminRoutes = require('../components/admin/routes/adminRoutes');
const websiteClientRouter = require('../components/api/routes/websiteClientRoutes');
const websiteEngineerRouter = require('../components/api/routes/websiteEngineerRoutes');

// Mount routes
router.use('/admin', adminRoutes);
router.use('/api/clients', websiteClientRouter);
router.use('/api/engineers', websiteEngineerRouter);

// 404 handler
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

module.exports = router; 