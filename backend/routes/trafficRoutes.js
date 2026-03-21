const express = require("express");
const router = express.Router();

const { getTrafficAnalysis } = require("../controllers/trafficController");

router.get("/traffic-analysis", getTrafficAnalysis);

module.exports = router;