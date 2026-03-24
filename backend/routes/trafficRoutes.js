// 

console.log("trafficRoutes loaded");

const express = require("express");
const router = express.Router();

const { 
    getTrafficAnalysis, 
    getSignalDecision,
    getCongestionPrediction 
} = require("../controllers/trafficController");

const { 
    getCollisionWarnings,
    getAccidentPrediction
} = require("../controllers/collisionController");

// Traffic routes
router.get("/traffic-analysis", getTrafficAnalysis);
router.get("/signal-decision", getSignalDecision);
router.get("/congestion-prediction", getCongestionPrediction);

// Collision routes
router.get("/collision-risk", getCollisionWarnings);
router.get("/accident-prediction", getAccidentPrediction);

module.exports = router;