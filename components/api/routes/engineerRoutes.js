const express = require('express');
const router = express.Router();
const EngineerController = require('../controllers/EngineerController');
const { validateEngineer } = require('../middleware/validators/engineerValidator');
const { isAuthenticated } = require('../../admin/middleware/authMiddleware');

// All routes are protected
router.use(isAuthenticated);

// Engineer routes
router.get('/', EngineerController.getAllEngineers);
router.get('/:id', EngineerController.getEngineer);
router.post('/', validateEngineer, EngineerController.createEngineer);
router.put('/:id', validateEngineer, EngineerController.updateEngineer);
router.delete('/:id', EngineerController.deleteEngineer);

module.exports = router; 