console.log("vehicleRoutes loaded");

const express = require("express");
const router = express.Router();

const {
  receiveVehicleData,
  getVehicles,
  getSignalDecision
} = require("../controllers/vehicleController");

// Routes
router.post("/vehicle-data", receiveVehicleData);
router.get("/vehicles", getVehicles);
router.get("/signal-decision", getSignalDecision);
const { getGreenCorridor } = require("../controllers/vehicleController");

router.get("/green-corridor", getGreenCorridor);

module.exports = router;