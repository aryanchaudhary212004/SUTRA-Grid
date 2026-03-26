function simulateFutureTraffic(vehicles) {

  const predictions = [];

  vehicles.forEach(v => {

    if (!v.lat || !v.lng) return;

    const futureLat = v.lat + (Math.random() - 0.5) * 0.002;
    const futureLng = v.lng + (Math.random() - 0.5) * 0.002;

    predictions.push({
      vehicle_id: v.vehicle_id,
      lat: futureLat,
      lng: futureLng,
      speed: v.speed
    });

  });

  return predictions;
}

module.exports = { simulateFutureTraffic };