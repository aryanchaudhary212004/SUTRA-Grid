const Vehicle = require("../models/Vehicle");

// 🚗 1. Receive vehicle data from simulator
exports.receiveVehicleData = async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(200).json({ message: "Vehicle data stored successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📡 2. Get latest vehicles (for dashboard map)
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🚦 3. Smart Signal Decision
exports.getSignalDecision = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .sort({ timestamp: -1 })
      .limit(100);

    const density = vehicles.length;

    let greenSignalDuration;
    let redSignalDuration;
    let yellowSignalDuration = 3;

    if (density > 80) {
      greenSignalDuration = 60;
      redSignalDuration = 20;
    } else if (density > 60) {
      greenSignalDuration = 45;
      redSignalDuration = 25;
    } else if (density > 40) {
      greenSignalDuration = 30;
      redSignalDuration = 30;
    } else if (density > 20) {
      greenSignalDuration = 20;
      redSignalDuration = 40;
    } else {
      greenSignalDuration = 10;
      redSignalDuration = 50;
    }

    res.json({
      density,
      greenSignalDuration,
      redSignalDuration,
      yellowSignalDuration,
      trafficLevel:
        density > 80 ? "Heavy" :
        density > 60 ? "High" :
        density > 40 ? "Moderate" :
        density > 20 ? "Low" : "Very Low"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🚑 4. Green Corridor Logic
exports.getGreenCorridor = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ timestamp: -1 }).limit(100);

    const ambulance = vehicles.find(v => v.isEmergency === true);

    if (!ambulance) {
      return res.json({ message: "No emergency vehicle active" });
    }

    const signals = [
      { id: "S1", lat: 28.6765, lng: 77.3200 },
      { id: "S2", lat: 28.6775, lng: 77.3220 },
      { id: "S3", lat: 28.6785, lng: 77.3240 }
    ];

    const getDistance = (lat1, lng1, lat2, lng2) => {
      return Math.sqrt(
        Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)
      );
    };

    const greenSignals = signals.map(signal => {
      const dist = getDistance(
        ambulance.lat, ambulance.lng,
        signal.lat, signal.lng
      );
      return {
        signalId: signal.id,
        lat: signal.lat,
        lng: signal.lng,
        distance: dist,
        status: dist < 0.01 ? "GREEN" : "NORMAL"
      };
    });

    res.json({ ambulance, corridor: greenSignals });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




