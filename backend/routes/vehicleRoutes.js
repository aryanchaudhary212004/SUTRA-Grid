const express = require("express");
const router = express.Router();

const { receiveVehicleData, getVehicles } = require("../controllers/vehicleController");
router.post("/vehicle-data", receiveVehicleData);
router.get("/vehicles", getVehicles);
module.exports = router;