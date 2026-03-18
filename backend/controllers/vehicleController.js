 const Vehicle = require("../models/Vehicle");

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
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ timestamp: -1 }).limit(50);
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};