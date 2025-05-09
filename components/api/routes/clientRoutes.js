const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/ClientController');
const { validateClient, validateProject } = require('../middleware/validators/clientValidator');
const { isAuthenticated } = require('../../admin/middleware/authMiddleware');

// All routes are protected
router.use(isAuthenticated);

// Client routes
router.get('/', ClientController.getAllClients);
router.get('/:id', ClientController.getClient);
router.post('/', validateClient, ClientController.createClient);
router.put('/:id', validateClient, ClientController.updateClient);
router.delete('/:id', ClientController.deleteClient);

// Project routes
router.post('/:id/projects', validateProject, ClientController.addProject);
router.put('/:clientId/projects/:projectId/status', ClientController.updateProjectStatus);
router.post('/:clientId/projects/:projectId/engineers', ClientController.assignEngineer);

module.exports = router; 