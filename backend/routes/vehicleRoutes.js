console.log("vehicleRoutes loaded");

const express = require("express");
const router = express.Router();

const {
  receiveVehicleData,
  getVehicles,
  getSignalDecision,
  getGreenCorridor
} = require("../controllers/vehicleController");

// POST vehicle data
router.post("/vehicle-data", receiveVehicleData);

// GET all vehicles
router.get("/", getVehicles);

// optional routes
router.get("/signal-decision", getSignalDecision);
router.get("/green-corridor", getGreenCorridor);

module.exports = router;