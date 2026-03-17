const express = require("express");
const router = express.Router();

const { receiveVehicleData } = require("../controllers/vehicleController");

router.post("/vehicle-data", receiveVehicleData);

module.exports = router;