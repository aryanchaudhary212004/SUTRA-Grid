import { Marker, Popup } from "react-leaflet";
import { useEffect, useRef } from "react";
import L from "leaflet";

const normalIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41]
});

export default function AnimatedMarker({ vehicle, prevVehicle }) {
  const markerRef = useRef();

  useEffect(() => {
    if (!markerRef.current || !prevVehicle) return;

    const marker = markerRef.current;
    const start = [prevVehicle.lat, prevVehicle.lng];
    const end = [vehicle.lat, vehicle.lng];

    let step = 0;
    const steps = 20;

    const interval = setInterval(() => {
      step++;

      const lat = start[0] + (end[0] - start[0]) * (step / steps);
      const lng = start[1] + (end[1] - start[1]) * (step / steps);

      marker.setLatLng([lat, lng]);

      if (step >= steps) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [vehicle, prevVehicle]);

  return (
    <Marker
      ref={markerRef}
      position={[vehicle.lat, vehicle.lng]}
      icon={normalIcon}
    >
      <Popup>
        <b>ID:</b> {vehicle.vehicle_id} <br />
        Speed: {vehicle.speed}
      </Popup>
    </Marker>
  );
}