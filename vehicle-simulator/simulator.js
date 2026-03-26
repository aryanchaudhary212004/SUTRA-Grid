const axios = require("axios");

const API_URL = "http://127.0.0.1:5000/api/vehicles/vehicle-data";

const MAX_VEHICLES = 100;
let activeVehicles = 0;

/* ───────────── ROAD NETWORK ───────────── */
const roads = {
  GT_EAST_L1: [
    [28.67662,77.32012],[28.67688,77.32098],[28.67718,77.32198],
    [28.67748,77.32298],[28.67778,77.32398],[28.67808,77.32498],
    [28.67828,77.32558]
  ],

  GT_EAST_L2: [
    [28.6767,77.3203],[28.6769,77.3213],[28.6772,77.3224],
    [28.6775,77.3235],[28.6778,77.3245],[28.6781,77.3254]
  ],

  GT_WEST_L1: [
    [28.67828,77.32558],[28.67808,77.32498],[28.67778,77.32398],
    [28.67748,77.32298],[28.67718,77.32198],[28.67688,77.32098],
    [28.67662,77.32012]
  ],

  GT_WEST_L2: [
    [28.6781,77.3255],[28.6778,77.3245],[28.6775,77.3235],
    [28.6772,77.3224],[28.6769,77.3213],[28.6767,77.3203]
  ],

  ROUNDABOUT_INNER: [
    [28.67825,77.32565],[28.67835,77.32590],[28.67830,77.32615],
    [28.67815,77.32615],[28.67805,77.32590],[28.67810,77.32565]
  ],

  ROUNDABOUT_OUTER: [
    [28.67830,77.32560],[28.67845,77.32595],[28.67835,77.32630],
    [28.67810,77.32630],[28.67795,77.32595],[28.67805,77.32560]
  ],

  ENTRY_NORTH: [
    [28.6790,77.3265],[28.6787,77.3263],[28.6785,77.3261],
    [28.67835,77.3259]
  ],

  EXIT_SOUTH: [
    [28.67805,77.3256],[28.6778,77.3253],[28.6775,77.3250],
    [28.6772,77.3247]
  ]
};

const roadNames = Object.keys(roads);

/* ───────────── STATES ───────────── */
const vehicleState = {};
const SAFE_DISTANCE = 0.00015;

function isTooClose(v1, v2) {
  const dx = v1.lat - v2.lat;
  const dy = v1.lng - v2.lng;
  return Math.sqrt(dx * dx + dy * dy) < SAFE_DISTANCE;
}
function avoidCollision(vehicle, allVehicles) {
  if (!vehicle) return;

  for (let other of allVehicles) {
    if (!other) continue;

    if (vehicle.vehicle_id === other.vehicle_id) continue;

    if (isTooClose(vehicle, other)) {
      vehicle.speed = Math.max(5, vehicle.speed - 15);
      vehicle.brake = true;
      return;
    }
  }

  vehicle.brake = false;
}


const randomState = {};

/* ───────────── LANE OFFSET ───────────── */
function applyLaneOffset(lat, lng, lane) {
 const offset = lane === 1 ? 0.00002 : -0.00002;
  return [lat + offset, lng + offset];
}

/* ───────────── CREATE VEHICLE ───────────── */
function createNewVehicle() {
  if (activeVehicles >= MAX_VEHICLES) return;

  const id = "VH" + (activeVehicles + 1);

  vehicleState[id] = {
    road: roadNames[Math.floor(Math.random() * roadNames.length)],
    lane: Math.random() > 0.5 ? 1 : 2,
    index: Math.floor(Math.random() * 3),
    progress: Math.random()
  };

  activeVehicles++;
  console.log("🚗 New Vehicle Added:", id);
}

/* ───────────── NORMAL VEHICLE ───────────── */
function generateVehicle(id, state) {
  console.log("STATE:", state);
  if (!state || !state.road) {
  console.log("Invalid state:", state);
  return;
}
  const road = roads[state.road];
  const nextIndex = (state.index + 1) % road.length;

  const [lat1, lng1] = road[state.index];
  const [lat2, lng2] = road[nextIndex];

  state.progress += 0.05 + Math.random() * 0.03;

  if (state.progress >= 1) {
    state.index = nextIndex;
    state.progress = 0;

    if (state.road.includes("GT_EAST") && state.index === road.length - 1) {
      state.road = "ROUNDABOUT_INNER";
      state.index = 0;
    } 
    else if (state.road === "ROUNDABOUT_INNER" && state.index === road.length - 1) {
      state.road = "EXIT_SOUTH";
      state.index = 0;
    } 
    else if (state.road === "EXIT_SOUTH" && state.index === road.length - 1) {
      state.road = "GT_WEST_L1";
      state.index = 0;
    } 
    else if (state.road.includes("GT_WEST") && state.index === road.length - 1) {
      state.road = "ENTRY_NORTH";
      state.index = 0;
    } 
    else if (state.road === "ENTRY_NORTH" && state.index === road.length - 1) {
      state.road = "ROUNDABOUT_OUTER";
      state.index = 0;
    } 
    else if (state.road === "ROUNDABOUT_OUTER" && state.index === road.length - 1) {
      state.road = "GT_EAST_L1";
      state.index = 0;
    }
  }

  const lat = lat1 + (lat2 - lat1) * state.progress;
  const lng = lng1 + (lng2 - lng1) * state.progress;

  const [finalLat, finalLng] = applyLaneOffset(lat, lng, state.lane);
  const directions = ["north", "south", "east", "west"];

  return {
    vehicle_id: vehicleId,
    lat: lat + laneOffset,
    lng: lng + laneOffset,
    speed: Math.floor(Math.random() * 60) + 20,
    direction: "forward",
    brake: Math.random() < 0.05
  };
}

/* ───────────── RANDOM VEHICLE ───────────── */
function generateRandomVehicle(id) {
  if (!randomState[id]) {
    randomState[id] = {
      lat: 28.6775 + (Math.random() - 0.5) * 0.01,
      lng: 77.3245 + (Math.random() - 0.5) * 0.01
    };
  }

  randomState[id].lat += (Math.random() - 0.5) * 0.0005;
  randomState[id].lng += (Math.random() - 0.5) * 0.0005;

  return {
    vehicle_id: id,
    lat: randomState[id].lat,
    lng: randomState[id].lng,
    lane: Math.random() > 0.5 ? 1 : 2,
    road: "RANDOM",
    speed: 5 + Math.random() * 35,
    direction: "random",
    brake: Math.random() > 0.85
  };
}

/* ───────────── SEND DATA ───────────── */
async function sendVehicleData(vehicle) {
  try {
    await axios.post(API_URL, vehicle);
  } catch (err) {
    console.log(err.message);
  }
}

// Simulate traffic
function simulateTraffic() {
  for (let i = 1; i <= 100; i++) {
    const vehicle = generateVehicle(i);
    sendVehicleData(vehicle);
  }

}
/* ───────────── RUN ───────────── */

// Run every 3 seconds
setInterval(simulateTraffic, 3000);