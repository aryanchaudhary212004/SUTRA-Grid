const axios = require("axios");

const API_URL = "http://127.0.0.1:5000/api/vehicles/vehicle-data";

// Road network with shared intersection
const roads = {
  MG_ROAD: [
    [28.6762, 77.3211],
    [28.6775, 77.3240], // intersection
    [28.6790, 77.3270]
  ],

  SECTOR_ROAD: [
    [28.6758, 77.3205],
    [28.6775, 77.3240], // SAME intersection
    [28.6780, 77.3254]
  ]
};

const vehicleState = {};

// Generate vehicle movement
function generateVehicle(id) {
  const vehicleId = "VH" + id;

  // Initialize vehicle
  if (!vehicleState[vehicleId]) {
    const roadNames = Object.keys(roads);
    const roadName = roadNames[Math.floor(Math.random() * roadNames.length)];

    vehicleState[vehicleId] = {
      road: roadName,
      index: 0,
      progress: 0
    };
  }

  const state = vehicleState[vehicleId];
  const road = roads[state.road];

  const nextIndex = (state.index + 1) % road.length;

  const [lat1, lng1] = road[state.index];
  const [lat2, lng2] = road[nextIndex];

  // Smooth interpolation
  state.progress += 0.2;

  if (state.progress >= 1) {
    state.index = nextIndex;
    state.progress = 0;

    // 🔥 Smart intersection switching
    if (state.index === 1 && Math.random() < 0.3) {
      const otherRoads = Object.keys(roads).filter(r => r !== state.road);
      state.road = otherRoads[Math.floor(Math.random() * otherRoads.length)];
      state.index = 0;
    }
  }

  const lat = lat1 + (lat2 - lat1) * state.progress;
  const lng = lng1 + (lng2 - lng1) * state.progress;

  // lane randomness
  const laneOffset = (Math.random() - 0.5) * 0.0001;

  return {
    vehicle_id: vehicleId,
    lat: lat + laneOffset,
    lng: lng + laneOffset,
    speed: Math.floor(Math.random() * 60) + 20,
    direction: "forward",
    brake: Math.random() < 0.05
  };
}

// Send data to backend
async function sendVehicleData(vehicle) {
  try {
    await axios.post(API_URL, vehicle);
    console.log("✅ Sent:", vehicle.vehicle_id);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Simulate traffic
function simulateTraffic() {
  for (let i = 1; i <= 100; i++) {
    const vehicle = generateVehicle(i);
    sendVehicleData(vehicle);
  }
}

// Run every 3 seconds
setInterval(simulateTraffic, 3000);