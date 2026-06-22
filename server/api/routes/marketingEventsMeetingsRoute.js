const express = require("express");
const { Middleware } = require("../middleware/authMiddleware");
const planModuleGuard = require("../middleware/planModuleGuard");
const marketingMeetingsController = require("../controllers/marketingMeetingsController");

const router = express.Router();

const guard = [Middleware, planModuleGuard("Marketing")];

router.post("/createMarketingMeetings", guard, marketingMeetingsController.creationMeetingMark);
router.get("/allMarketingMeetings", guard, marketingMeetingsController.getAllMeetingMark);
router.get("/marketingMeetingbyorganization/:id", guard, marketingMeetingsController.getAllMeetingMarkbyorganisation);
router.get("/marketingMeeting/:id", guard, marketingMeetingsController.getByIdMeetingMark);
router.put("/marketingMeeting/:id", guard, marketingMeetingsController.meetingMarkUpdate);
router.delete("/marketingMeeting/:id", guard, marketingMeetingsController.deleteMeetingMark);

module.exports = router;
