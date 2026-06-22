const express = require('express');
const { Middleware } = require('../middleware/authMiddleware');
const planModuleGuard = require('../middleware/planModuleGuard');
const trainingController = require('../controllers/TrainingManagementController');

const router = express.Router();

const guard = [Middleware, planModuleGuard("Training&Learning")];

router.post('/trainingManagement', guard, trainingController.createTraining);
router.get('/trainingManagement', guard, trainingController.getTrainings);
router.get('/trainingManagement/:id', guard, trainingController.getTrainingById);
router.put('/trainingManagement/:id', guard, trainingController.updateTraining);
router.delete('/trainingManagement/:id', guard, trainingController.deleteTraining);

module.exports = router;
