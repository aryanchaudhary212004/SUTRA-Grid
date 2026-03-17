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