const Vehicle = require("../models/Vehicle");
const { analyzeTraffic } = require("../services/trafficService");

exports.getTrafficAnalysis = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ timestamp: -1 }).limit(500);

    const analysis = analyzeTraffic(vehicles);

    res.json({ congestionZones: analysis });

  } catch (error) {
    res.status(500).json({ error: error.message });
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

    const primarySignalData = analysis.length > 0
      ? analysis[0]
      : {
          density: 0,
          trafficLevel: "Low",
          greenSignalDuration: 30,
          redSignalDuration: 30,
          yellowSignalDuration: 5,
          emergency: false,
          recommendation: "Normal flow",
          prediction: "Traffic stable"
        };

    // ✅ ONLY ONE RESPONSE
    res.json(primarySignalData);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};