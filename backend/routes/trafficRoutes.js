console.log("trafficRoutes loaded");

const express = require("express");
const router = express.Router();

const { getTrafficAnalysis, getSignalDecision } = require("../controllers/trafficController");
const { getCollisionWarnings } = require("../controllers/collisionController");

router.get("/traffic-analysis", getTrafficAnalysis);
router.get("/signal-decision", getSignalDecision);
router.get("/collision-risk", getCollisionWarnings);

module.exports = router;
