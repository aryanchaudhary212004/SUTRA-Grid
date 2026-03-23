function analyzeTraffic(vehicles) {
<<<<<<< HEAD

=======
>>>>>>> c5137494c88673d86312735efa6f448bd248fb3d
  const zones = {};
  const congestionZones = [];
  let emergencyZone = null;

  vehicles.forEach(v => {

    if (!v.lat || !v.lng) return;

    const zone = `${v.lat.toFixed(3)}-${v.lng.toFixed(3)}`;

    if (!zones[zone]) zones[zone] = 0;
    zones[zone]++;

<<<<<<< HEAD
    // detect ambulance
    if (v.vehicle_id && v.vehicle_id.includes("AMB")) {
      emergencyZone = zone;
    }

=======
    if (v.vehicle_id && v.vehicle_id.includes("AMB")) {
      emergencyZone = zone;
    }
>>>>>>> c5137494c88673d86312735efa6f448bd248fb3d
  });

  Object.keys(zones).forEach(zone => {
    const density = zones[zone];

    let signalTime = 30;
    let recommendation = "Normal signal cycle";
    let prediction = "Traffic stable";
<<<<<<< HEAD
=======
    let trafficLevel = "Low";
    let redSignalDuration = 30;
    let yellowSignalDuration = 5;
>>>>>>> c5137494c88673d86312735efa6f448bd248fb3d

    if (density > 20) {
      signalTime = 60;
      recommendation = "Increase green signal time";
<<<<<<< HEAD
      prediction = "🚨 Heavy congestion expected in next 5 minutes";
    }
    else if (density > 10) {
      signalTime = 45;
      recommendation = "Moderate congestion";
      prediction = "⚠ Congestion likely in next 3 minutes";
    }
    else if (density > 5) {
      prediction = "🟡 Traffic increasing gradually";
    }
    else {
      prediction = "🟢 Smooth traffic expected";
=======
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
>>>>>>> c5137494c88673d86312735efa6f448bd248fb3d
    }

    if (zone === emergencyZone) {
      signalTime = 90;
      recommendation = "🚑 Emergency vehicle priority";
<<<<<<< HEAD
    }

    congestionZones.push({
      zone,
      density,
      recommendation,
      greenTime: signalTime,
      emergency: zone === emergencyZone,
      prediction
    });
=======
      prediction = "Green corridor activated for emergency vehicle";
      trafficLevel = "Emergency";
      redSignalDuration = 10;
    }
>>>>>>> c5137494c88673d86312735efa6f448bd248fb3d

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
