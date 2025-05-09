const Admin = require('../models/Admin');

const isAuthenticated = async (req, res, next) => {
  try {
    // Check if admin is logged in via session
    if (!req.session.adminId) {
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      return res.redirect('/admin/login');
    }

    // Verify admin exists
    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      req.session.destroy();
      if (req.xhr || req.headers.accept.includes('application/json')) {
        return res.status(401).json({
          success: false,
          message: 'Invalid session'
        });
      }
      return res.redirect('/admin/login');
    }

    // Add admin to request object
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
    res.redirect('/admin/login');
  }
};

const isNotAuthenticated = (req, res, next) => {
  if (req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

module.exports = {
  isAuthenticated,
  isNotAuthenticated
}; 