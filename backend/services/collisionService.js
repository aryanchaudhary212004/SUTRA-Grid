function detectCollisions(vehicles) {
  const warnings = [];
  const DIST_THRESHOLD = 0.002;   // ~200 meters
  const SPEED_THRESHOLD = 40;     // combined speed threshold
  const MAX_WARNINGS = 50;        // max warnings to return

  for (let i = 0; i < vehicles.length; i++) {
    for (let j = i + 1; j < vehicles.length; j++) {
      if (warnings.length >= MAX_WARNINGS) break;

      const v1 = vehicles[i];
      const v2 = vehicles[j];

      if (!v1.lat || !v1.lng || !v2.lat || !v2.lng) continue;

      const distance = Math.sqrt(
        Math.pow(v1.lat - v2.lat, 2) + Math.pow(v1.lng - v2.lng, 2)
      );

      const isOpposingDirections =
        (v1.direction === "north" && v2.direction === "south") ||
        (v1.direction === "south" && v2.direction === "north") ||
        (v1.direction === "east" && v2.direction === "west") ||
        (v1.direction === "west" && v2.direction === "east");

      const combinedSpeed = (v1.speed || 0) + (v2.speed || 0);

      if (distance < DIST_THRESHOLD && combinedSpeed > SPEED_THRESHOLD) {
        let risk = "MEDIUM";
        let message = "Vehicles in close proximity";

        if (isOpposingDirections && combinedSpeed > 60) {
          risk = "CRITICAL";
          message = "Head-on collision imminent";
        } else if (combinedSpeed > 100) {
          risk = "HIGH";
          message = "High-speed collision risk";
        }

        warnings.push({
          vehicles: [v1.vehicle_id, v2.vehicle_id],
          lat: (v1.lat + v2.lat) / 2,
          lng: (v1.lng + v2.lng) / 2,
          risk,
          message,
          distance: distance.toFixed(6),
          combinedSpeed
        });
      }
    }
  }

  console.log("Collision warnings detected:", warnings.length);
  return warnings.slice(0, MAX_WARNINGS); // limit to 50
}

module.exports = { detectCollisions };