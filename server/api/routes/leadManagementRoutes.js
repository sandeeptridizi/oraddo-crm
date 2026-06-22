const express = require("express");
const managementController = require("../controllers/leadManagementController");
const { Middleware } = require("../middleware/authMiddleware");
const planModuleGuard = require("../middleware/planModuleGuard");

const router = express.Router();

const guard = [Middleware, planModuleGuard("Lead_Management")];

router.post("/managements", guard, managementController.createManagement);
router.get("/managements", guard, managementController.getManagements);
router.get("/managementOrganizationId/:id", guard, managementController.getManagementByOrgId);
router.get("/managements/:id", guard, managementController.getManagementById);
router.put("/managements/:id", guard, managementController.updateManagement);
router.delete("/managements/:id", guard, managementController.deleteManagement);

module.exports = router;
