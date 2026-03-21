function analyzeTraffic(vehicles) {

  const zones = {};
  const congestionZones = [];
  let emergencyZone = null;

  vehicles.forEach(v => {
    if (!v.lat || !v.lng) return;
    const zone = `${v.lat.toFixed(3)}-${v.lng.toFixed(3)}`;

    if (!zones[zone]) zones[zone] = 0;
    zones[zone]++;
    // Detect ambulance
  if (v.vehicle_id && v.vehicle_id.includes("AMB")) {
    emergencyZone = zone;
  }
  });

  Object.keys(zones).forEach(zone => {

    const density = zones[zone];

    let signalTime = 30;
    let recommendation = "Normal signal cycle";

    if (density > 20) {
    signalTime = 60;
    recommendation = "Increase green signal time";
    }
    else if (density > 10) {
      signalTime = 45;
      recommendation = "Moderate congestion";
    }
    //emergency override
    
    if (zone === emergencyZone) {
    signalTime = 90;
    recommendation = "🚑 Emergency vehicle priority";
  }

  congestionZones.push({
    zone,
    density,
    recommendation,
    greenTime: signalTime,
    emergency: zone === emergencyZone
  });

  });

  return congestionZones;
}

module.exports = { analyzeTraffic };