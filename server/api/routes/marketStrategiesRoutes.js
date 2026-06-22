const express = require("express");
const marketingStrategiesController = require("../controllers/marketingStrategiesController");
const { Middleware } = require("../middleware/authMiddleware");
const planModuleGuard = require("../middleware/planModuleGuard");

const router = express.Router();

const guard = [Middleware, planModuleGuard("Marketing")];

router.post("/marketing-strategies", guard, marketingStrategiesController.createStrategy);
router.get("/marketing-strategies", guard, marketingStrategiesController.getStrategies);
router.get("/marketing-strategiesbyorganization/:id", guard, marketingStrategiesController.getStrategiesByOrganization);
router.get("/marketing-strategies/:id", guard, marketingStrategiesController.getStrategyById);
router.put("/marketing-strategies/:id", guard, marketingStrategiesController.updateStrategy);
router.delete("/marketing-strategies/:id", guard, marketingStrategiesController.deleteStrategy);

module.exports = router;
