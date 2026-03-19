const Vehicle = require("../models/Vehicle");


// 🚗 1. Receive vehicle data from simulator
exports.receiveVehicleData = async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();

    res.status(200).json({
      message: "Vehicle data stored successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


// 📡 2. Get latest vehicles (for dashboard map)
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .sort({ timestamp: -1 })
      .limit(100);   // only latest 100 vehicles

    res.json(vehicles);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


// 🚦 3. Smart Signal Decision (IMPORTANT)
exports.getSignalDecision = async (req, res) => {
  try {
    // only recent vehicles (important fix)
    const vehicles = await Vehicle.find()
      .sort({ timestamp: -1 })
      .limit(100);

    const density = vehicles.length;

    let signalTime;

    if (density > 80) {
      signalTime = 60;   // heavy traffic
    } else if (density > 40) {
      signalTime = 40;   // medium traffic
    } else {
      signalTime = 20;   // low traffic
    }

    res.json({
      density,
      greenSignalDuration: signalTime
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};