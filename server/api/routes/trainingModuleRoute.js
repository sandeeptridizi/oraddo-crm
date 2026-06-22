const express = require('express');
const { Middleware } = require('../middleware/authMiddleware');
const planModuleGuard = require('../middleware/planModuleGuard');
const { createModule, updateLessonStatusController } = require('../controllers/trainingModuleController');
const { getModuleWithLessons, getModuleByOrgId, assignTraineeAndUpdateLessons } = require('../services/trainingModuleServices');

const router = express.Router();

const guard = [Middleware, planModuleGuard("Training&Learning")];

router.post('/modulecreation', guard, createModule);
router.get('/modulecreation', guard, getModuleWithLessons);
router.get('/moduleorganization/:id', guard, getModuleByOrgId);
router.patch('/modulecreation', guard, updateLessonStatusController);
router.post('/modulecreation/:moduleId', guard, assignTraineeAndUpdateLessons);

module.exports = router;
