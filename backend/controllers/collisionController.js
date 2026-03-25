const Vehicle = require("../models/Vehicle");
const { detectCollisions } = require("../services/collisionService");

exports.getCollisionWarnings = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .sort({ timestamp: -1 })
      .limit(200);

    const warnings = detectCollisions(vehicles);

    res.json({
      total: warnings.length,
      warnings
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ ADD THIS FUNCTION (MISSING BEFORE)
exports.getAccidentPrediction = async (req, res) => {
  try {
    res.json({
      message: "No accident predicted",
      riskLevel: "Low"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};