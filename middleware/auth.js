const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return next();
    }
    res.redirect('/admin/login');
};

const isNotAuthenticated = (req, res, next) => {
    if (req.session && req.session.adminId) {
        return res.redirect('/admin/dashboard');
    }
    next();
};

module.exports = {
    isAuthenticated,
    isNotAuthenticated
}; 