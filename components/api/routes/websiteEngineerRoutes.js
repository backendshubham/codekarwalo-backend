const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');
const WebsiteEngineerController = require('../controllers/websiteEngineerController');

// Public engineer registration
router.post('/register', fileUpload(), WebsiteEngineerController.registerEngineer);

module.exports = router; 