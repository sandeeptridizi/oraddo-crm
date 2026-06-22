const express = require('express');
const leadCreationController = require('../controllers/leadCreationController');
const { Middleware } = require('../middleware/authMiddleware');
const planModuleGuard = require('../middleware/planModuleGuard');
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

const guard = [Middleware, planModuleGuard("Lead_Management")];

router.post("/fileUpload/:id", guard, upload.single('file'), leadCreationController.bulkUploadFiles);
router.post('/leadCreations', guard, leadCreationController.createLeadCreation);
router.get('/leadCreations', guard, leadCreationController.getLeadCreations);
router.get('/leadCreationByOrganization/:id', guard, leadCreationController.getLeadCreationsByOrganization);
router.get('/leadCreations/:id', guard, leadCreationController.getLeadCreationById);
router.put('/leadCreations/:id', guard, leadCreationController.updateLeadCreation);
router.delete('/leadCreations/:id', guard, leadCreationController.deleteLeadCreation);

module.exports = router;
