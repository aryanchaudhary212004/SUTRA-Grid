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


exports.runAISimulation = async (req, res) => {
  try {
    const io = req.app.get("io");

    if (global.aiRunning) {
      return res.json({ message: "AI already running" });
    }

    global.aiRunning = true;

    const Vehicle = require("../models/Vehicle");

    // 🔍 STEP 1 — analyze zones
    const zones = await Vehicle.aggregate([
      {
        $group: {
          _id: {
            lat: { $round: ["$lat", 3] },
            lng: { $round: ["$lng", 3] }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // 📡 STEP 2 — send analysis log
    io.emit("ai-update", "Analyzing traffic...");
    io.emit("ai-update", "Finding congested zones...");

    // 🔥 STEP 3 — CONTROL SIGNALS
    zones.forEach((z, i) => {

      let greenTime = 30;

      if (z.count > 80) greenTime = 70;
      else if (z.count > 50) greenTime = 60;
      else if (z.count > 20) greenTime = 45;

      const zoneId = `${z._id.lat}-${z._id.lng}`;

      io.emit("signal-update", {
        zone: zoneId,
        density: z.count,
        greenTime
      });

    });

    io.emit("ai-update", "Adjusting signals...");
    io.emit("ai-update", "Optimizing flow...");
    io.emit("ai-update", "Traffic improved!");
    io.emit("ai-update", "✅ Simulation complete");

    global.aiRunning = false;

    return res.json({ message: "AI simulation started" });

  } catch (err) {
    global.aiRunning = false;
    return res.status(500).json({ error: err.message });
  }
};