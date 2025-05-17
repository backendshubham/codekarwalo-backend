const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const ClientController = require('../controllers/ClientController');
const EngineerController = require('../controllers/EngineerController');
const ProjectController = require('../controllers/ProjectController');
const ActivityController = require('../controllers/ActivityController');
const ActivityLogController = require('../controllers/ActivityLogController');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');
const Engineer = require('../../api/models/Engineer');
const Client = require('../../api/models/Client');
const Project = require('../../api/models/Project');

// Auth routes
router.get('/login', isNotAuthenticated, AdminController.getLoginPage);
router.post('/login', isNotAuthenticated, AdminController.login);
router.get('/logout', isAuthenticated, AdminController.logout);

// Dashboard routes
router.get('/dashboard', isAuthenticated, AdminController.getDashboard);
router.get('/api/dashboard/stats', isAuthenticated, AdminController.getDashboardStats);
router.get('/api/dashboard/earnings-this-month', isAuthenticated, EngineerController.getEarningsThisMonth);
router.get('/api/dashboard/top-engineers', isAuthenticated, AdminController.getTopEngineers);
router.get('/api/dashboard/top-clients', isAuthenticated, AdminController.getTopClients);

// Project Management Routes
router.get('/projects', isAuthenticated, (req, res) => {
  res.render('admin/projects', { activePage: 'projects' });
});
router.get('/api/projects', isAuthenticated, ProjectController.getAllProjects);
router.get('/api/projects/:id', isAuthenticated, ProjectController.getProjectById);
router.post('/api/projects', isAuthenticated, ProjectController.createProject);
router.put('/api/projects/:id', isAuthenticated, ProjectController.updateProject);
router.delete('/api/projects/:id', isAuthenticated, ProjectController.deleteProject);
router.post('/api/projects/:id/assign-engineers', isAuthenticated, ProjectController.assignEngineers);

// Client Management Routes
router.get('/clients', isAuthenticated, (req, res) => {
  res.render('admin/clients', { activePage: 'clients' });
});
router.get('/api/clients', isAuthenticated, ClientController.getAllClients);
router.get('/api/clients/:id', isAuthenticated, ClientController.getClientById);
router.get('/api/clients/:id/projects', isAuthenticated, ClientController.getClientProjects);
router.post('/api/clients', isAuthenticated, ClientController.createClient);
router.put('/api/clients/:id', isAuthenticated, ClientController.updateClient);
router.delete('/api/clients/:id', isAuthenticated, ClientController.deleteClient);
router.post('/api/clients/:id/activate', isAuthenticated, ClientController.setActive);
router.post('/api/clients/:id/deactivate', isAuthenticated, ClientController.setInactive);

// Engineer Management Routes
router.get('/engineers', isAuthenticated, (req, res) => {
  res.render('admin/engineers', { activePage: 'engineers' });
});
router.get('/api/engineers', isAuthenticated, EngineerController.getAllEngineers);
router.post('/api/engineers', isAuthenticated, EngineerController.createEngineer);
router.put('/api/engineers/:id', isAuthenticated, EngineerController.updateEngineer);
router.delete('/api/engineers/:id', isAuthenticated, EngineerController.deleteEngineer);
router.post('/api/engineers/:id/activate', isAuthenticated, EngineerController.setActive);
router.post('/api/engineers/:id/deactivate', isAuthenticated, EngineerController.setInactive);
router.get('/api/engineers/:id', isAuthenticated, EngineerController.getEngineerById);

// Activity Log Routes
router.get('/activities', isAuthenticated, (req, res) => {
  res.render('admin/activity', { activePage: 'activities' });
});
router.get('/api/activities', isAuthenticated, ActivityController.getAllActivities);
router.get('/api/activity-log', isAuthenticated, ActivityLogController.getActivityLog);

module.exports = router;
