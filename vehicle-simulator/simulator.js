const axios = require("axios");

const API_URL = "http://127.0.0.1:5000/api/vehicles/vehicle-data";
const MAX_VEHICLES = 50;

/* ROAD NETWORK */
const roads = {

GT_EAST_L1: [
[28.67662,77.32012],
[28.67688,77.32098],
[28.67718,77.32198],
[28.67748,77.32298],
[28.67778,77.32398],
[28.67808,77.32498],
[28.67828,77.32558]
],

GT_EAST_L2: [
[28.6767,77.3203],
[28.6769,77.3213],
[28.6772,77.3224],
[28.6775,77.3235],
[28.6778,77.3245],
[28.6781,77.3254]
],

GT_WEST_L1: [
[28.67828,77.32558],
[28.67808,77.32498],
[28.67778,77.32398],
[28.67748,77.32298],
[28.67718,77.32198],
[28.67688,77.32098],
[28.67662,77.32012]
],

GT_WEST_L2: [
[28.6781,77.3255],
[28.6778,77.3245],
[28.6775,77.3235],
[28.6772,77.3224],
[28.6769,77.3213],
[28.6767,77.3203]
],

ROUNDABOUT_INNER: [
[28.67825,77.32565],
[28.67835,77.32590],
[28.67830,77.32615],
[28.67815,77.32615],
[28.67805,77.32590],
[28.67810,77.32565]
],

ROUNDABOUT_OUTER: [
[28.67830,77.32560],
[28.67845,77.32595],
[28.67835,77.32630],
[28.67810,77.32630],
[28.67795,77.32595],
[28.67805,77.32560]
],

ENTRY_NORTH: [
[28.6790,77.3265],
[28.6787,77.3263],
[28.6785,77.3261],
[28.67835,77.3259]
],

EXIT_SOUTH: [
[28.67805,77.3256],
[28.6778,77.3253],
[28.6775,77.3250],
[28.6772,77.3247]
]

};

/* VEHICLE STATE */
const vehicleState = {};

/* LANE OFFSET */
function applyLaneOffset(lat,lng,lane){

const offset = lane === 1 ? 0.000012 : -0.000012;

return [lat + offset,lng + offset];

}

/* INITIALIZE VEHICLES */
const roadNames = Object.keys(roads);

for(let i=1;i<=MAX_VEHICLES;i++){

vehicleState["VH"+i] = {

road: roadNames[i % roadNames.length],
lane: i % 2 === 0 ? 1 : 2,
index: Math.floor(Math.random()*3),
progress: Math.random()

};

}

/* GENERATE POSITION */
function generateVehicle(vehicleId,state){

const road = roads[state.road];

const nextIndex = (state.index+1) % road.length;

const [lat1,lng1] = road[state.index];
const [lat2,lng2] = road[nextIndex];

/* smooth movement */
state.progress += 0.05 + Math.random()*0.03;

if(state.progress >= 1){

state.index = nextIndex;
state.progress = 0;

/* ROUTE TRANSITIONS */

if(state.road==="GT_EAST_L1" || state.road==="GT_EAST_L2"){
if(state.index===road.length-1){
state.road="ROUNDABOUT_INNER";
state.index=0;
}
}

else if(state.road==="ROUNDABOUT_INNER"){
if(state.index===road.length-1){
state.road="EXIT_SOUTH";
state.index=0;
}
}

else if(state.road==="EXIT_SOUTH"){
if(state.index===road.length-1){
state.road="GT_WEST_L1";
state.index=0;
}
}

else if(state.road==="GT_WEST_L1" || state.road==="GT_WEST_L2"){
if(state.index===road.length-1){
state.road="ENTRY_NORTH";
state.index=0;
}
}

else if(state.road==="ENTRY_NORTH"){
if(state.index===road.length-1){
state.road="ROUNDABOUT_OUTER";
state.index=0;
}
}

else if(state.road==="ROUNDABOUT_OUTER"){
if(state.index===road.length-1){
state.road="GT_EAST_L1";
state.index=0;
}
}

}

/* interpolation */
const lat = lat1 + (lat2-lat1)*state.progress;
const lng = lng1 + (lng2-lng1)*state.progress;

/* lane offset */
const [finalLat,finalLng] = applyLaneOffset(lat,lng,state.lane);

return {

vehicle_id: vehicleId,
lat: finalLat,
lng: finalLng,
lane: state.lane,
road: state.road,
speed: 30 + Math.random()*20,
direction:"forward",
brake:false

};

}

/* SEND DATA */
async function sendVehicleData(vehicle){

try{
await axios.post(API_URL,vehicle);
}
catch(err){
console.log(err.message);
}

}

/* SIMULATION LOOP */
function simulateTraffic(){

for(let i=1;i<=MAX_VEHICLES;i++){

const id="VH"+i;

const vehicle =
generateVehicle(id,vehicleState[id]);

sendVehicleData(vehicle);

}

}

setInterval(simulateTraffic,1000);