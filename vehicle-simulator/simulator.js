const axios = require("axios");

const API_URL = "http://127.0.0.1:5000/api/vehicles/vehicle-data";

function generateVehicle(id) {

  // 10% chance of ambulance
  const isAmbulance = Math.random() < 0.1;

  const vehicleId = isAmbulance
    ? "AMB" + id
    : "VH" + id;

  return {
    vehicle_id: vehicleId,
    lat: 28.67 + Math.random() * 0.01,
    lng: 77.32 + Math.random() * 0.01,
    speed: Math.floor(Math.random() * 80),
    direction: ["north", "south", "east", "west"][Math.floor(Math.random() * 4)],
    brake: Math.random() < 0.1,
    isEmergency: isAmbulance 
  };
}

async function sendVehicleData(vehicle) {
  try {
    await axios.post(API_URL, vehicle);
    console.log("Sent:", vehicle.vehicle_id);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function simulateTraffic() {
  for (let i = 1; i <= 100; i++) {
    const vehicle = generateVehicle(i);
    sendVehicleData(vehicle);
  }
}

setInterval(simulateTraffic, 3000);