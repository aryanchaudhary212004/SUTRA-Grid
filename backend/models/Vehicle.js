const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema({
  vehicle_id: String,
  lat: Number,
  lng: Number,
  speed: Number,
  direction: String,
  brake: Boolean,
  isEmergency: { type: Boolean, default: false },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Vehicle", VehicleSchema);