const Vehicle = require("../models/Vehicle");
const { analyzeTraffic } = require("../services/trafficService");
const axios = require("axios");

exports.getTrafficAnalysis = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ timestamp: -1 }).limit(200);

    const analysis = analyzeTraffic(vehicles);

    res.json({ congestionZones: analysis });

  } catch (error) {
    res.status(200).json({ error: error.message });
  }
};
exports.getCongestionPrediction = async (req, res) => {
  try {
    res.json({
      prediction: "Traffic expected to remain stable",
      level: "Low"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSignalDecision = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ timestamp: -1 }).limit(500);

    const analysis = analyzeTraffic(vehicles);

    const primary = analysis.length > 0 ? analysis[0] : null;

    res.json({
      density: primary?.density || 0,
      trafficLevel: primary?.density > 20 ? "Heavy" :
                    primary?.density > 10 ? "Moderate" : "Low",

      greenSignalDuration: primary?.greenTime || 30,
      redSignalDuration: 30,
      yellowSignalDuration: 5
    });

    res.json(primarySignalData);
  } catch (error) {
    res.status(200).json({ error: error.message });
  }
};
