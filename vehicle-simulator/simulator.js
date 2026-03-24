const axios = require("axios");

const API_URL = "http://127.0.0.1:5000/api/vehicles/vehicle-data";

const MAX_VEHICLES = 50;

/*
REALISTIC ROAD NETWORK
around GT Road + roundabout area
*/

const roads = {

GT_EAST_L1: [
[28.67660,77.32010],
[28.67685,77.32095],
[28.67715,77.32195],
[28.67745,77.32295],
[28.67775,77.32395],
[28.67805,77.32495],
[28.67825,77.32555]
],

GT_EAST_L2: [
[28.67655,77.32020],
[28.67680,77.32105],
[28.67710,77.32205],
[28.67740,77.32305],
[28.67770,77.32405],
[28.67800,77.32505],
[28.67820,77.32565]
],

GT_WEST_L1: [
[28.67825,77.32555],
[28.67805,77.32495],
[28.67775,77.32395],
[28.67745,77.32295],
[28.67715,77.32195],
[28.67685,77.32095],
[28.67660,77.32010]
],

GT_WEST_L2: [
[28.67820,77.32565],
[28.67800,77.32505],
[28.67770,77.32405],
[28.67740,77.32305],
[28.67710,77.32205],
[28.67680,77.32105],
[28.67655,77.32020]
],

ROUNDABOUT: [
[28.67830,77.32560],
[28.67845,77.32585],
[28.67845,77.32615],
[28.67825,77.32635],
[28.67800,77.32635],
[28.67785,77.32610],
[28.67785,77.32580],
[28.67805,77.32560],
[28.67830,77.32560]
],

ENTRY_CURVE: [
[28.67900,77.32650],
[28.67880,77.32635],
[28.67860,77.32620],
[28.67845,77.32605]
],

EXIT_CURVE: [
[28.67805,77.32560],
[28.67780,77.32540],
[28.67755,77.32520],
[28.67730,77.32500]
],

SERVICE_LANE: [
[28.67790,77.32470],
[28.67810,77.32485],
[28.67830,77.32505],
[28.67845,77.32525]
]

};

/*
store each vehicle's position state
*/
const vehicleState = {};

/*
lane offset creates 2 parallel lanes
*/
function applyLaneOffset(lat,lng,lane){

  const offset = lane === 1 ? 0.000015 : -0.000015;

  return [
    lat + offset,
    lng + offset
  ];

}

/*
initialize vehicle positions
*/
for(let i=1;i<=MAX_VEHICLES;i++){

  const roadNames = Object.keys(roads);

  vehicleState["VH"+i] = {

    road:
      roadNames[
        i % roadNames.length
      ],

    lane:
      i % 2 === 0
        ? 1
        : 2,

    index:
      Math.floor(Math.random()*3),

    progress:
      Math.random()

  };

}

/*
generate vehicle position
*/
function generateVehicle(vehicleId,state){

  const road = roads[state.road];

  const nextIndex =
    (state.index+1) % road.length;

  const [lat1,lng1] =
    road[state.index];

  const [lat2,lng2] =
    road[nextIndex];

  /*
  smooth movement
  different speed prevents grouping
  */
  state.progress +=
    0.05 + Math.random()*0.03;

  if(state.progress >= 1){

    state.index = nextIndex;

    state.progress = 0;

    /*
    roundabout routing
    */
    if(
      state.road==="GT_ROAD_EASTBOUND"
      && state.index===road.length-1
    ){

      state.road="ROUNDABOUT";
      state.index=0;

    }

    else if(
      state.road==="ROUNDABOUT"
      && state.index===4
    ){

      state.road="GT_ROAD_WESTBOUND";
      state.index=2;

    }

  }

  /*
  interpolation
  */
  const lat =
    lat1 + (lat2-lat1)*state.progress;

  const lng =
    lng1 + (lng2-lng1)*state.progress;

  /*
  apply lane offset
  */
  const [finalLat,finalLng] =
    applyLaneOffset(
      lat,
      lng,
      state.lane
    );

  return {

    vehicle_id: vehicleId,

    lat: finalLat,

    lng: finalLng,

    lane: state.lane,

    road: state.road,

    speed:
      30 + Math.random()*20,

    direction:"forward",

    brake:false

  };

}

/*
send to backend
*/
async function sendVehicleData(vehicle){

  try{

    await axios.post(
      API_URL,
      vehicle
    );

  }

  catch(err){

    console.log(err.message);

  }

}

/*
simulate traffic
*/
function simulateTraffic(){

  for(let i=1;i<=MAX_VEHICLES;i++){

    const id="VH"+i;

    const vehicle =
      generateVehicle(
        id,
        vehicleState[id]
      );

    sendVehicleData(vehicle);

  }

}

setInterval(
  simulateTraffic,
  1000
);