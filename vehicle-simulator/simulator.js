const axios = require("axios");

const API_URL = "http://localhost:5000/api/vehicle-data";

function generateVehicle(id) {
  return {
    vehicle_id: "VH" + id,
    lat: 28.67 + Math.random() * 0.01,
    lng: 77.32 + Math.random() * 0.01,
    speed: Math.floor(Math.random() * 80),
    direction: ["north", "south", "east", "west"][Math.floor(Math.random() * 4)],
    brake: Math.random() < 0.1
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