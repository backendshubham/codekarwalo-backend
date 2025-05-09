const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const ClientController = require('../controllers/ClientController');
const EngineerController = require('../controllers/EngineerController');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

// Auth routes
router.get('/login', isNotAuthenticated, AdminController.getLoginPage);
router.post('/login', isNotAuthenticated, AdminController.login);
router.get('/logout', isAuthenticated, AdminController.logout);

// Dashboard routes
router.get('/dashboard', isAuthenticated, AdminController.getDashboard);
router.get('/api/dashboard/stats', isAuthenticated, AdminController.getDashboardStats);

// Project Management Routes
router.get('/projects', isAuthenticated, (req, res) => {
  res.render('admin/projects');
});
router.get('/api/projects', isAuthenticated, AdminController.getAllProjects);
router.get('/api/projects/:id', isAuthenticated, AdminController.getProjectById);
router.post('/api/projects', isAuthenticated, AdminController.createProject);
router.put('/api/projects/:id', isAuthenticated, AdminController.updateProject);
router.delete('/api/projects/:id', isAuthenticated, AdminController.deleteProject);

// Client Management Routes
router.get('/clients', isAuthenticated, ClientController.list);
router.get('/api/clients', isAuthenticated, AdminController.getAllClients);
router.get('/api/clients/:id', isAuthenticated, AdminController.getClientById);
router.post('/api/clients', isAuthenticated, AdminController.createClient);
router.put('/api/clients/:id', isAuthenticated, AdminController.updateClient);
router.delete('/api/clients/:id', isAuthenticated, AdminController.deleteClient);

// Engineer Management Routes
router.get('/engineers', isAuthenticated, EngineerController.list);
router.post('/api/engineers/:id/activate', isAuthenticated, EngineerController.setActive);
router.post('/api/engineers/:id/deactivate', isAuthenticated, EngineerController.setInactive);
router.put('/api/engineers/:id', isAuthenticated, EngineerController.editEngineer);
router.delete('/api/engineers/:id', isAuthenticated, EngineerController.deleteEngineer);

module.exports = router;
