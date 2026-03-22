function analyzeTraffic(vehicles) {
  const zones = {};
  const congestionZones = [];
  let emergencyZone = null;

  vehicles.forEach(v => {
    if (!v.lat || !v.lng) return;

    const zone = `${v.lat.toFixed(3)}-${v.lng.toFixed(3)}`;

    if (!zones[zone]) zones[zone] = 0;
    zones[zone]++;

    if (v.vehicle_id && v.vehicle_id.includes("AMB")) {
      emergencyZone = zone;
    }
  });

  Object.keys(zones).forEach(zone => {
    const density = zones[zone];

    let signalTime = 30;
    let recommendation = "Normal signal cycle";
    let prediction = "Traffic stable";
    let trafficLevel = "Low";
    let redSignalDuration = 30;
    let yellowSignalDuration = 5;

    if (density > 20) {
      signalTime = 60;
      recommendation = "Increase green signal time";
      prediction = "Heavy congestion expected to persist";
      trafficLevel = "Heavy";
      redSignalDuration = 20;
    } else if (density > 10) {
      signalTime = 45;
      recommendation = "Moderate congestion";
      prediction = "Congestion likely in next 3 minutes";
      trafficLevel = "High";
      redSignalDuration = 25;
    } else {
      trafficLevel = "Moderate";
    }

    if (zone === emergencyZone) {
      signalTime = 90;
      recommendation = "🚑 Emergency vehicle priority";
      prediction = "Green corridor activated for emergency vehicle";
      trafficLevel = "Emergency";
      redSignalDuration = 10;
    }

    congestionZones.push({
      zone,
      density,
      recommendation,
      greenTime: signalTime,
      prediction,
      emergency: zone === emergencyZone,
      trafficLevel,
      greenSignalDuration: signalTime,
      redSignalDuration,
      yellowSignalDuration
    });
  });

  return congestionZones;
}

module.exports = { analyzeTraffic };
