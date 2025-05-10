const express = require('express');
const router = express.Router();
const WebsiteClientController = require('../controllers/websiteClientController');
const { websiteClientAuth } = require('../middleware/websiteClientAuth');

// Public registration and login
router.post('/register', WebsiteClientController.registerClient);
router.post('/login', WebsiteClientController.loginClient);

// Protected routes
router.get('/profile', websiteClientAuth, WebsiteClientController.getProfile);
router.post('/create-project', websiteClientAuth, WebsiteClientController.submitProject);
router.get('/projects', websiteClientAuth, WebsiteClientController.getMyProjects);

module.exports = router; 