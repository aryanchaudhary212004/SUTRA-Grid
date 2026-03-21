const Vehicle = require("../models/Vehicle");
const { analyzeTraffic } = require("../services/trafficService");

exports.getTrafficAnalysis = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ timestamp: -1 }).limit(500);

    const analysis = analyzeTraffic(vehicles);

    res.json({
      congestionZones: analysis
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};